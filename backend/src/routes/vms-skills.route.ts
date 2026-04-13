import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { createSkill, deleteSkillByName, getSkillByName, listSkills, updateSkillByName } from '../repositories/vms-skills.repository'
import { createSkillSchema, skillParamsSchema, updateSkillSchema } from '../schemas/vms-skill.schema'
import type { AppBindings } from '../types/bindings'

export const vmsSkillsRoute = new Hono<{ Bindings: AppBindings }>()

vmsSkillsRoute.get('/skills', async (c) => {
  try {
    const skills = await listSkills(c.env.VMS_DB)
    return c.json({ skills })
  } catch (error) {
    console.error('Failed to list skills', error)
    return c.json({ error: 'Could not fetch skills.' }, 500)
  }
})

vmsSkillsRoute.get('/skills/:name', zValidator('param', skillParamsSchema), async (c) => {
  try {
    const { name } = c.req.valid('param')
    const skill = await getSkillByName(c.env.VMS_DB, name)

    if (!skill) {
      return c.json({ error: 'Skill not found.' }, 404)
    }

    return c.json({ skill })
  } catch (error) {
    console.error('Failed to fetch skill', error)
    return c.json({ error: 'Could not fetch skill.' }, 500)
  }
})

vmsSkillsRoute.post('/skills', zValidator('json', createSkillSchema), async (c) => {
  try {
    const payload = c.req.valid('json')
    const skill = await createSkill(c.env.VMS_DB, payload)

    return c.json({ skill }, 201)
  } catch (error) {
    console.error('Failed to create skill', error)
    return c.json({ error: 'Could not create skill.' }, 500)
  }
})

vmsSkillsRoute.put(
  '/skills/:name',
  zValidator('param', skillParamsSchema),
  zValidator('json', updateSkillSchema),
  async (c) => {
    try {
      const { name } = c.req.valid('param')
      const payload = c.req.valid('json')

      const existing = await getSkillByName(c.env.VMS_DB, name)
      if (!existing) {
        return c.json({ error: 'Skill not found.' }, 404)
      }

      const skill = await updateSkillByName(c.env.VMS_DB, name, payload)
      return c.json({ skill })
    } catch (error) {
      console.error('Failed to update skill', error)
      return c.json({ error: 'Could not update skill.' }, 500)
    }
  },
)

vmsSkillsRoute.delete('/skills/:name', zValidator('param', skillParamsSchema), async (c) => {
  try {
    const { name } = c.req.valid('param')
    const deleted = await deleteSkillByName(c.env.VMS_DB, name)

    if (!deleted) {
      return c.json({ error: 'Skill not found.' }, 404)
    }

    return c.json({ message: 'Skill deleted successfully.' })
  } catch (error) {
    console.error('Failed to delete skill', error)
    return c.json({ error: 'Could not delete skill.' }, 500)
  }
})
