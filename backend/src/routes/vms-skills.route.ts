import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { createSkill, deleteSkillById, getSkillById, getSkillByName, listSkills } from '../repositories/vms-skills.repository'
import { createSkillSchema, searchSkillsSchema, skillParamsSchema } from '../schemas/vms-skill.schema'
import { generateId } from '../utils/id'
import type { AppBindings } from '../types/bindings'

export const vmsSkillsRoute = new Hono<{ Bindings: AppBindings }>()

// GET /skills - List all skills with optional search
vmsSkillsRoute.get('/skills', zValidator('query', searchSkillsSchema), async (c) => {
  try {
    const { search } = c.req.valid('query')
    const skills = await listSkills(c.env.VMS_DB, search)
    return c.json({ skills })
  } catch (error) {
    console.error('Failed to list skills', error)
    return c.json({ error: 'Could not fetch skills.' }, 500)
  }
})

// GET /skills/:id - Get a specific skill by ID
vmsSkillsRoute.get('/skills/:id', zValidator('param', skillParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const skill = await getSkillById(c.env.VMS_DB, id)

    if (!skill) {
      return c.json({ error: 'Skill not found.' }, 404)
    }

    return c.json({ skill })
  } catch (error) {
    console.error('Failed to fetch skill', error)
    return c.json({ error: 'Could not fetch skill.' }, 500)
  }
})

// POST /skills/search-or-create - Search for skills or create new one if not found
vmsSkillsRoute.post('/skills/search-or-create', zValidator('json', createSkillSchema), async (c) => {
  try {
    const payload = c.req.valid('json')

    // Try to find by name first
    let skill = await getSkillByName(c.env.VMS_DB, payload.name)

    if (!skill) {
      // Create new skill if not found
      const skillId = generateId()
      skill = await createSkill(c.env.VMS_DB, {
        id: skillId,
        name: payload.name,
        description: payload.description,
      })
    }

    return c.json({ skill }, skill ? 200 : 201)
  } catch (error) {
    console.error('Failed to search or create skill', error)
    return c.json({ error: 'Could not process skill.' }, 500)
  }
})

// POST /skills - Create a new skill
vmsSkillsRoute.post('/skills', zValidator('json', createSkillSchema), async (c) => {
  try {
    const payload = c.req.valid('json')

    // Check if skill already exists
    const existing = await getSkillByName(c.env.VMS_DB, payload.name)
    if (existing) {
      return c.json({ error: 'Skill with this name already exists.' }, 409)
    }

    const skillId = generateId()
    const skill = await createSkill(c.env.VMS_DB, {
      id: skillId,
      name: payload.name,
      description: payload.description,
    })

    return c.json({ skill }, 201)
  } catch (error) {
    console.error('Failed to create skill', error)
    return c.json({ error: 'Could not create skill.' }, 500)
  }
})

// DELETE /skills/:id - Delete a skill by ID
vmsSkillsRoute.delete('/skills/:id', zValidator('param', skillParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const deleted = await deleteSkillById(c.env.VMS_DB, id)

    if (!deleted) {
      return c.json({ error: 'Skill not found.' }, 404)
    }

    return c.json({ message: 'Skill deleted successfully.' })
  } catch (error) {
    console.error('Failed to delete skill', error)
    return c.json({ error: 'Could not delete skill.' }, 500)
  }
})
