const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/user');
const Event = require('../models/events');
const Conversation = require('../models/conversation');
const Message = require('../models/message');

describe('Event Routes', () => {
  let token;
  let userId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'eventuser',
        email: 'event@example.com',
        password: 'password123',
        first_name: 'Event',
        last_name: 'User',
        user_type: 'player',
        date_of_birth: new Date('1995-01-15')
      });
    token = res.body.data.token;
    userId = res.body.data.user.id;
  });

  const validEvent = {
    title: 'Weekly Pickup Game',
    description: 'Join us for a friendly pickup game every Sunday',
    event_type: 'pickup_game',
    location: {
      name: 'Central Park Field',
      address: '123 Park Ave',
      city: 'Toronto'
    },
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    start_time: '14:00',
    end_time: '16:00',
    price: 10,
    max_participants: 22,
    skill_level: 'intermediate',
    approval_status: 'approved'
  };

  describe('POST /api/events', () => {
    it('should create an event successfully', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send(validEvent);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.event.title).toBe(validEvent.title);
      expect(res.body.data.event.creator._id).toBe(userId);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/events')
        .send(validEvent);

      expect(res.status).toBe(401);
    });

    it('should fail with missing required fields', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test' });

      expect(res.status).toBe(400);
    });

    it('should fail with invalid event type', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validEvent, event_type: 'invalid' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/events', () => {
    beforeEach(async () => {
      await Event.create({
        ...validEvent,
        creator: userId
      });
    });

    it('should get all events', async () => {
      const res = await request(app)
        .get('/api/events');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.events).toBeInstanceOf(Array);
      expect(res.body.data.events.length).toBeGreaterThan(0);
    });

    it('should filter events by event_type', async () => {
      const res = await request(app)
        .get('/api/events')
        .query({ event_type: 'pickup_game' });

      expect(res.status).toBe(200);
      expect(res.body.data.events.every(e => e.event_type === 'pickup_game')).toBe(true);
    });

    it('should filter events by city', async () => {
      const res = await request(app)
        .get('/api/events')
        .query({ city: 'Toronto' });

      expect(res.status).toBe(200);
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/events')
        .query({ page: 1, limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/events/:id', () => {
    let eventId;

    beforeEach(async () => {
      const event = await Event.create({
        ...validEvent,
        creator: userId
      });
      eventId = event._id.toString();
    });

    it('should get a single event', async () => {
      const res = await request(app)
        .get(`/api/events/${eventId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.event._id).toBe(eventId);
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/events/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid ID format', async () => {
      const res = await request(app)
        .get('/api/events/invalid-id');

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/events/:id', () => {
    let eventId;

    beforeEach(async () => {
      const event = await Event.create({
        ...validEvent,
        creator: userId
      });
      eventId = event._id.toString();
    });

    it('should update an event', async () => {
      const res = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.event.title).toBe('Updated Title');
    });

    it('should fail if not the creator', async () => {
      // Create another user
      const otherRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'otheruser',
          email: 'other@example.com',
          password: 'password123',
          first_name: 'Other',
          last_name: 'User',
          user_type: 'player',
          date_of_birth: new Date('1995-01-15')
        });

      const res = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${otherRes.body.data.token}`)
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/events/:id', () => {
    let eventId;

    beforeEach(async () => {
      const event = await Event.create({
        ...validEvent,
        creator: userId
      });
      eventId = event._id.toString();
    });

    it('should delete an event', async () => {
      const res = await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      // Verify deleted
      const getRes = await request(app)
        .get(`/api/events/${eventId}`);
      expect(getRes.status).toBe(404);
    });

    it('should fail if not the creator', async () => {
      const otherRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'deluser',
          email: 'del@example.com',
          password: 'password123',
          first_name: 'Del',
          last_name: 'User',
          user_type: 'player',
          date_of_birth: new Date('1995-01-15')
        });

      const res = await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${otherRes.body.data.token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/events/:id/interest', () => {
    let eventId;

    beforeEach(async () => {
      const event = await Event.create({
        ...validEvent,
        creator: userId
      });
      eventId = event._id.toString();
    });

    it('should express interest as going', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/interest`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'going' });

      expect(res.status).toBe(200);
      expect(res.body.data.participants_count).toBe(1);
    });

    it('should express interest as interested', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/interest`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'interested' });

      expect(res.status).toBe(200);
    });

    it('should fail with invalid status', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/interest`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'maybe' });

      expect(res.status).toBe(400);
    });

    it('should update existing interest', async () => {
      await request(app)
        .post(`/api/events/${eventId}/interest`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'interested' });

      const res = await request(app)
        .post(`/api/events/${eventId}/interest`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'going' });

      expect(res.status).toBe(200);
      expect(res.body.data.participants_count).toBe(1);
    });
  });

  describe('DELETE /api/events/:id/interest', () => {
    let eventId;

    beforeEach(async () => {
      const event = await Event.create({
        ...validEvent,
        creator: userId,
        interested: [{
          user: userId,
          status: 'going'
        }]
      });
      eventId = event._id.toString();
    });

    it('should remove interest', async () => {
      const res = await request(app)
        .delete(`/api/events/${eventId}/interest`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      // Verify removed
      const getRes = await request(app)
        .get(`/api/events/${eventId}`);
      expect(getRes.body.data.event.interested.length).toBe(0);
    });
  });

  describe('Event Join Request System', () => {
    let eventId;
    let creatorToken;
    let requesterToken;
    let requesterId;

    beforeEach(async () => {
      // Create event by original user
      const event = await Event.create({
        ...validEvent,
        creator: userId,
        requires_approval: true
      });
      eventId = event._id.toString();
      creatorToken = token;

      // Create another user to request joining
      const requesterRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'requester',
          email: 'requester@example.com',
          password: 'password123',
          first_name: 'Requester',
          last_name: 'User',
          user_type: 'player',
          date_of_birth: new Date('1995-01-15')
        });
      requesterToken = requesterRes.body.data.token;
      requesterId = requesterRes.body.data.user.id;
    });

    describe('POST /api/events/:id/join', () => {
      it('should create a join request', async () => {
        const res = await request(app)
          .post(`/api/events/${eventId}/join`)
          .set('Authorization', `Bearer ${requesterToken}`)
          .send({ message: 'I want to join!' });

        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe('pending');
      });

      it('should not allow duplicate pending requests', async () => {
        await request(app)
          .post(`/api/events/${eventId}/join`)
          .set('Authorization', `Bearer ${requesterToken}`)
          .send({ message: 'First request' });

        const res = await request(app)
          .post(`/api/events/${eventId}/join`)
          .set('Authorization', `Bearer ${requesterToken}`)
          .send({ message: 'Second request' });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('pending request');
      });

      it('should join directly if event does not require approval', async () => {
        await Event.findByIdAndUpdate(eventId, { requires_approval: false });

        const res = await request(app)
          .post(`/api/events/${eventId}/join`)
          .set('Authorization', `Bearer ${requesterToken}`)
          .send({});

        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe('approved');
      });
    });

    describe('PUT /api/events/:id/requests/:requestId', () => {
      let requestId;

      beforeEach(async () => {
        // Create a join request
        await request(app)
          .post(`/api/events/${eventId}/join`)
          .set('Authorization', `Bearer ${requesterToken}`)
          .send({ message: 'Please let me join!' });

        // Get the request ID
        const event = await Event.findById(eventId);
        requestId = event.join_requests[0]._id.toString();
      });

      it('should approve a join request', async () => {
        const res = await request(app)
          .put(`/api/events/${eventId}/requests/${requestId}`)
          .set('Authorization', `Bearer ${creatorToken}`)
          .send({ status: 'approved' });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('approved');

        // Verify participant was added
        const event = await Event.findById(eventId);
        expect(event.participants.some(p => p.user.toString() === requesterId)).toBe(true);
      });

      it('should reject a join request', async () => {
        const res = await request(app)
          .put(`/api/events/${eventId}/requests/${requestId}`)
          .set('Authorization', `Bearer ${creatorToken}`)
          .send({ status: 'rejected' });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('rejected');

        // Verify participant was NOT added
        const event = await Event.findById(eventId);
        expect(event.participants.some(p => p.user.toString() === requesterId)).toBe(false);
      });

      it('should fail if not the creator', async () => {
        const res = await request(app)
          .put(`/api/events/${eventId}/requests/${requestId}`)
          .set('Authorization', `Bearer ${requesterToken}`)
          .send({ status: 'approved' });

        expect(res.status).toBe(403);
      });

      it('should fail with invalid status', async () => {
        const res = await request(app)
          .put(`/api/events/${eventId}/requests/${requestId}`)
          .set('Authorization', `Bearer ${creatorToken}`)
          .send({ status: 'maybe' });

        expect(res.status).toBe(400);
      });
    });

    describe('POST /api/events/:id/message', () => {
      it('should send a message to the event host', async () => {
        const res = await request(app)
          .post(`/api/events/${eventId}/message`)
          .set('Authorization', `Bearer ${requesterToken}`)
          .send({ content: 'Hi, is this event still on?' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.message.content).toBe('Hi, is this event still on?');
        expect(res.body.data.conversation_id).toBeDefined();
      });

      it('should reuse existing conversation on second message', async () => {
        const res1 = await request(app)
          .post(`/api/events/${eventId}/message`)
          .set('Authorization', `Bearer ${requesterToken}`)
          .send({ content: 'First message' });

        const res2 = await request(app)
          .post(`/api/events/${eventId}/message`)
          .set('Authorization', `Bearer ${requesterToken}`)
          .send({ content: 'Second message' });

        expect(res1.body.data.conversation_id.toString())
          .toBe(res2.body.data.conversation_id.toString());
      });

      it('should allow the host to receive the message in the conversation', async () => {
        const msgRes = await request(app)
          .post(`/api/events/${eventId}/message`)
          .set('Authorization', `Bearer ${requesterToken}`)
          .send({ content: 'Can I join?' });

        const convId = msgRes.body.data.conversation_id;

        const res = await request(app)
          .get(`/api/messages/conversations/${convId}`)
          .set('Authorization', `Bearer ${creatorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.messages.some(m => m.content === 'Can I join?')).toBe(true);
      });

      it('should fail if the host messages their own event', async () => {
        const res = await request(app)
          .post(`/api/events/${eventId}/message`)
          .set('Authorization', `Bearer ${creatorToken}`)
          .send({ content: 'Talking to myself' });

        expect(res.status).toBe(400);
      });

      it('should fail without message content', async () => {
        const res = await request(app)
          .post(`/api/events/${eventId}/message`)
          .set('Authorization', `Bearer ${requesterToken}`)
          .send({});

        expect(res.status).toBe(400);
      });

      it('should fail without authentication', async () => {
        const res = await request(app)
          .post(`/api/events/${eventId}/message`)
          .send({ content: 'Anonymous message' });

        expect(res.status).toBe(401);
      });

      it('should return 404 for non-existent event', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .post(`/api/events/${fakeId}/message`)
          .set('Authorization', `Bearer ${requesterToken}`)
          .send({ content: 'Hello?' });

        expect(res.status).toBe(404);
      });
    });

    describe('DELETE /api/events/:id/participants/:userId', () => {
      beforeEach(async () => {
        // Add requester as participant
        await Event.findByIdAndUpdate(eventId, {
          $push: { participants: { user: requesterId, joined_at: new Date() } }
        });
      });

      it('should allow participant to leave', async () => {
        const res = await request(app)
          .delete(`/api/events/${eventId}/participants/${requesterId}`)
          .set('Authorization', `Bearer ${requesterToken}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('left');

        // Verify participant was removed
        const event = await Event.findById(eventId);
        expect(event.participants.some(p => p.user.toString() === requesterId)).toBe(false);
      });

      it('should allow creator to remove participant', async () => {
        const res = await request(app)
          .delete(`/api/events/${eventId}/participants/${requesterId}`)
          .set('Authorization', `Bearer ${creatorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('removed');
      });
    });
  });

  describe('POST /api/events/:id/comments', () => {
    let eventId;

    beforeEach(async () => {
      const eventRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validEvent, approval_status: 'approved' });
      eventId = eventRes.body.data.event._id;
    });

    it('should add a comment to an event', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Looking forward to this game!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.content).toBe('Looking forward to this game!');
    });

    it('should reject empty comment content', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '   ' });

      expect(res.status).toBe(400);
    });

    it('should reject comment exceeding 500 characters', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'x'.repeat(501) });

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated comment', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/comments`)
        .send({ content: 'Unauthorized comment' });

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/events/${fakeId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Test comment' });

      expect(res.status).toBe(404);
    });
  });
});
