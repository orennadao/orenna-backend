import request from 'supertest'

const base = 'http://0.0.0.0:3000'

describe('API smoke', () => {
  it('health', async () => {
    const r = await request(base).get('/health')
    expect(r.status).toBe(200)
    expect(r.body.ok).toBe(true)
  })

  it('projects lifecycle', async () => {
    // create
    const created = await request(base)
      .post('/projects')
      .send({ name: 'Curl Demo', slug: 'curl-demo' })
      .set('Content-Type','application/json')
    expect(created.status).toBe(201)
    const id = created.body.id
    expect(id).toBeTruthy()

    // get
    const got = await request(base).get(`/projects/${id}`)
    expect(got.status).toBe(200)
    expect(got.body.slug).toBe('curl-demo')

    // list
    const list = await request(base).get('/projects?limit=5&offset=0')
    expect(list.status).toBe(200)
    expect(Array.isArray(list.body)).toBe(true)

    // update
    const updated = await request(base)
      .put(`/projects/${id}`)
      .send({ description: 'updated' })
      .set('Content-Type','application/json')
    expect(updated.status).toBe(200)
    expect(updated.body.description).toBe('updated')

    // delete
    const del = await request(base).delete(`/projects/${id}`)
    expect(del.status).toBe(200)

    // 404 after delete
    const miss = await request(base).get(`/projects/${id}`)
    expect(miss.status).toBe(404)
  })
})
