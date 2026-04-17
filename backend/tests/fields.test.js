const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const Field = require('../models/field');

describe('Field Routes', () => {
  const validField = {
    name: 'Downsview Sports Complex',
    description: 'Premium outdoor soccer facility with excellent turf',
    address: {
      street: '1750 Sheppard Ave W',
      city: 'Toronto',
      province: 'Ontario',
      postal_code: 'M3L 1Y3'
    },
    field_type: 'turf',
    size: '11v11',
    amenities: ['parking', 'changing_rooms', 'lighting', 'seating'],
    operating_hours: {
      monday: { open: '06:00', close: '23:00' },
      tuesday: { open: '06:00', close: '23:00' },
      wednesday: { open: '06:00', close: '23:00' },
      thursday: { open: '06:00', close: '23:00' },
      friday: { open: '06:00', close: '23:00' },
      saturday: { open: '07:00', close: '22:00' },
      sunday: { open: '07:00', close: '22:00' }
    },
    hourly_rate: 150
  };

  beforeEach(async () => {
    await Field.create(validField);
  });

  describe('GET /api/fields', () => {
    it('should get all fields', async () => {
      const res = await request(app)
        .get('/api/fields');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fields).toBeInstanceOf(Array);
      expect(res.body.data.fields.length).toBeGreaterThan(0);
    });

    it('should filter by city', async () => {
      const res = await request(app)
        .get('/api/fields')
        .query({ city: 'Toronto' });

      expect(res.status).toBe(200);
      expect(res.body.data.fields.every(f => f.address.city.includes('Toronto'))).toBe(true);
    });

    it('should filter by field type', async () => {
      const res = await request(app)
        .get('/api/fields')
        .query({ field_type: 'turf' });

      expect(res.status).toBe(200);
      expect(res.body.data.fields.every(f => f.field_type === 'turf')).toBe(true);
    });

    it('should filter by size', async () => {
      const res = await request(app)
        .get('/api/fields')
        .query({ size: '11v11' });

      expect(res.status).toBe(200);
    });

    it('should filter by max price', async () => {
      const res = await request(app)
        .get('/api/fields')
        .query({ max_price: 200 });

      expect(res.status).toBe(200);
      expect(res.body.data.fields.every(f => f.hourly_rate <= 200)).toBe(true);
    });
  });

  describe('GET /api/fields/:id', () => {
    let fieldId;

    beforeEach(async () => {
      const field = await Field.findOne({ name: validField.name });
      fieldId = field._id.toString();
    });

    it('should get a single field', async () => {
      const res = await request(app)
        .get(`/api/fields/${fieldId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.field.name).toBe(validField.name);
    });

    it('should return 404 for non-existent field', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/fields/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/fields/:id/reviews', () => {
    let fieldId;
    let token;

    beforeEach(async () => {
      const field = await Field.findOne({ name: validField.name });
      fieldId = field._id.toString();

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'reviewuser',
          email: 'reviewer@example.com',
          password: 'password123',
          first_name: 'Review',
          last_name: 'User',
          user_type: 'player',
          date_of_birth: new Date('1995-01-15')
        });
      token = res.body.data.token;
    });

    it('should add a review successfully', async () => {
      const res = await request(app)
        .post(`/api/fields/${fieldId}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 4, comment: 'Great field, well maintained!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.review.rating).toBe(4);
      expect(res.body.data.rating).toBeDefined();
    });

    it('should add a review without comment', async () => {
      const res = await request(app)
        .post(`/api/fields/${fieldId}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 5 });

      expect(res.status).toBe(201);
      expect(res.body.data.review.rating).toBe(5);
    });

    it('should update field average rating after review', async () => {
      await request(app)
        .post(`/api/fields/${fieldId}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 4, comment: 'Good field' });

      const fieldRes = await request(app).get(`/api/fields/${fieldId}`);
      expect(fieldRes.body.data.field.rating.average).toBeGreaterThan(0);
      expect(fieldRes.body.data.field.rating.count).toBe(1);
    });

    it('should reject invalid rating below 1', async () => {
      const res = await request(app)
        .post(`/api/fields/${fieldId}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 0, comment: 'Bad' });

      expect(res.status).toBe(400);
    });

    it('should reject invalid rating above 5', async () => {
      const res = await request(app)
        .post(`/api/fields/${fieldId}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 6, comment: 'Too high' });

      expect(res.status).toBe(400);
    });

    it('should prevent duplicate reviews from same user', async () => {
      await request(app)
        .post(`/api/fields/${fieldId}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 4, comment: 'First review' });

      const res = await request(app)
        .post(`/api/fields/${fieldId}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 2, comment: 'Duplicate' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post(`/api/fields/${fieldId}/reviews`)
        .send({ rating: 3, comment: 'No auth' });

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent field', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/fields/${fakeId}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 3 });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/fields (search filter)', () => {
    it('should filter fields by partial name search', async () => {
      const res = await request(app)
        .get('/api/fields')
        .query({ search: 'Downsview' });

      expect(res.status).toBe(200);
      expect(res.body.data.fields.some(f => f.name.includes('Downsview'))).toBe(true);
    });

    it('should do case-insensitive name search', async () => {
      const res = await request(app)
        .get('/api/fields')
        .query({ search: 'downsview' });

      expect(res.status).toBe(200);
      expect(res.body.data.fields.some(f => f.name.toLowerCase().includes('downsview'))).toBe(true);
    });
  });

  describe('GET /api/fields/:id/availability', () => {
    let fieldId;

    beforeEach(async () => {
      const field = await Field.findOne({ name: validField.name });
      fieldId = field._id.toString();
    });

    it('should get field availability for a date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await request(app)
        .get(`/api/fields/${fieldId}/availability`)
        .query({ date: tomorrow.toISOString().split('T')[0] });

      expect(res.status).toBe(200);
      expect(res.body.data.field_id).toBe(fieldId);
      expect(res.body.data.hourly_rate).toBe(validField.hourly_rate);
    });

    it('should fail without date parameter', async () => {
      const res = await request(app)
        .get(`/api/fields/${fieldId}/availability`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Date');
    });
  });
});
