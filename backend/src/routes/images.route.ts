import { Context } from 'hono'
import { getEventById, updateEventById } from '../repositories/vms-events.repository'
import type { AppBindings } from '../types/bindings'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB per file
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILES = 5

export async function uploadImages(c: Context<{ Bindings: AppBindings }>) {
  const bucket = c.env.MY_BUCKET

  if (!bucket) {
    return c.json({ error: 'R2 bucket not configured' }, 500)
  }

  try {
    const formData = await c.req.formData()
    const files = formData.getAll('images') as File[]

    if (!files || files.length === 0) {
      return c.json({ error: 'No files provided' }, 400)
    }

    if (files.length > MAX_FILES) {
      return c.json(
        { error: `Maximum ${MAX_FILES} files allowed per upload` },
        400,
      )
    }

    // Validate all files before uploading
    for (const file of files) {
      if (!file || !(file instanceof File)) {
        return c.json({ error: 'Invalid file in request' }, 400)
      }

      if (file.size > MAX_FILE_SIZE) {
        return c.json(
          {
            error: `File "${file.name}" exceeds maximum size of 5MB`,
          },
          400,
        )
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return c.json(
          {
            error: `File "${file.name}" has unsupported type. Allowed: JPEG, PNG, WebP, GIF`,
          },
          400,
        )
      }
    }

    // Upload all files
    const uploadedUrls: Record<string, string> = {}
    const errors: string[] = []

    for (const file of files) {
      try {
        const timestamp = Date.now()
        const randomSuffix = crypto.getRandomValues(new Uint8Array(4))
        const hexSuffix = Array.from(randomSuffix)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
        const sanitizedName = file.name
          .toLowerCase()
          .replace(/[^a-z0-9.-]/g, '-')
          .replace(/--+/g, '-')
        const key = `events/${timestamp}-${hexSuffix}-${sanitizedName}`

        const arrayBuffer = await file.arrayBuffer()
        await bucket.put(key, arrayBuffer, {
          httpMetadata: {
            contentType: file.type,
          },
        })

        // Generate public URL
        const publicUrl = `${c.req.url.split('/images/upload')[0]}/event-images/${key}`
        uploadedUrls[file.name] = publicUrl
      } catch (error) {
        errors.push(`Failed to upload "${file.name}": ${String(error)}`)
      }
    }

    if (errors.length > 0) {
      return c.json(
        {
          error: 'Some files failed to upload',
          details: errors,
          uploadedUrls,
        },
        207,
      )
    }

    return c.json(
      {
        success: true,
        imageUrls: uploadedUrls,
      },
      201,
    )
  } catch (error) {
    console.error('Image upload error:', error)
    return c.json(
      { error: 'Failed to process upload request' },
      500,
    )
  }
}

export async function uploadEventBanner(c: Context<{ Bindings: AppBindings }>) {
  const bucket = c.env.MY_BUCKET
  const eventId = c.req.param('id')?.trim()

  if (!bucket) {
    return c.json({ error: 'R2 bucket not configured' }, 500)
  }

  if (!eventId) {
    return c.json({ error: 'Event ID is required.' }, 400)
  }

  const event = await getEventById(c.env.VMS_DB, eventId)
  if (!event) {
    return c.json({ error: 'Event not found.' }, 404)
  }

  try {
    const formData = await c.req.formData()
    const fileEntry = formData.get('image')

    if (!fileEntry || !(fileEntry instanceof File)) {
      return c.json({ error: 'No image file provided.' }, 400)
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return c.json({ error: 'Image exceeds maximum size of 5MB.' }, 400)
    }

    if (!ALLOWED_MIME_TYPES.includes(fileEntry.type)) {
      return c.json({ error: 'Unsupported image type. Allowed: JPEG, PNG, WebP, GIF.' }, 400)
    }

    const key = `events/${eventId}/banner/image.jpg`
    await bucket.delete(key)
    await bucket.put(key, await fileEntry.arrayBuffer(), {
      httpMetadata: {
        contentType: fileEntry.type,
      },
    })

    const requestUrl = new URL(c.req.url)
    const apiPrefix = `/ms/membership-app/api/events/${eventId}/banner`
    const basePath = requestUrl.pathname.endsWith(apiPrefix)
      ? requestUrl.pathname.slice(0, -apiPrefix.length)
      : '/ms/membership-app/api'
    const imageUrl = `${requestUrl.origin}${basePath}/event-images/${key}`

    const updatedEvent = await updateEventById(c.env.VMS_DB, eventId, { imageUrl })
    return c.json({ event: updatedEvent })
  } catch (error) {
    console.error('Event banner upload error:', error)
    return c.json({ error: 'Failed to upload event banner.' }, 500)
  }
}

// Serve uploaded images from R2
export async function serveImage(c: Context<{ Bindings: AppBindings }>) {
  const bucket = c.env.MY_BUCKET

  if (!bucket) {
    return c.json({ error: 'R2 bucket not configured' }, 500)
  }

  // Extract key from URL path: /ms/membership-app/api/event-images/events/... -> events/...
  const fullPath = c.req.path
  const idx = fullPath.indexOf('event-images/')
  if (idx === -1) {
    return c.json({ error: 'Invalid image path' }, 400)
  }

  const key = fullPath.substring(idx + 'event-images/'.length)

  if (!key) {
    return c.json({ error: 'Image key not provided' }, 400)
  }

  try {
    const object = await bucket.get(key)

    if (!object) {
      return c.json({ error: 'Image not found' }, 404)
    }

    const headers: Record<string, string> = {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400', // 24 hours
    }

    return new Response(object.body, {
      headers,
    })
  } catch (error) {
    console.error('Failed to retrieve image:', error)
    return c.json({ error: 'Failed to retrieve image' }, 500)
  }
}
