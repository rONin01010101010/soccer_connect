const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { app } = require('../server');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Mock Cloudinary so tests never hit the real API
jest.mock('../config/cloudinary', () => ({
  uploader: {
    upload_stream: jest.fn((_opts, cb) => {
      // Immediately resolve with a fake Cloudinary result
      const fakeResult = {
        secure_url: 'https://res.cloudinary.com/dtbxpn4zj/image/upload/soccer-connect/test.jpg',
        public_id: 'soccer-connect/test',
      };
      cb(null, fakeResult);
      // Return a writable stream stub
      return { end: jest.fn() };
    }),
  },
}));

// Helper to create a test user and JWT
const createAuthToken = async (overrides = {}) => {
  const user = await User.create({
    username: 'uploadtester',
    email: 'upload@test.com',
    password: 'password123',
    first_name: 'Upload',
    last_name: 'Tester',
    date_of_birth: new Date('1995-01-15'),
    user_type: 'player',
    ...overrides,
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  return { user, token };
};

// Create a minimal valid PNG buffer (1×1 pixel)
const minimalPngBuffer = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6260000000000200' +
  '01e221bc330000000049454e44ae426082',
  'hex'
);

beforeEach(() => {
  jest.clearAllMocks();
  // Re-apply the default mock implementation after clearing
  const cloudinary = require('../config/cloudinary');
  cloudinary.uploader.upload_stream.mockImplementation((_opts, cb) => {
    const fakeResult = {
      secure_url: 'https://res.cloudinary.com/dtbxpn4zj/image/upload/soccer-connect/test.jpg',
      public_id: 'soccer-connect/test',
    };
    cb(null, fakeResult);
    return { end: jest.fn() };
  });
});

describe('POST /api/upload', () => {
  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('image', minimalPngBuffer, 'test.png');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when no file is attached', async () => {
    const { token } = await createAuthToken();

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/no image/i);
  });

  it('should return 400 when file is not an image', async () => {
    const { token } = await createAuthToken();

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('this is plain text'), { filename: 'doc.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
  });

  it('should upload an image successfully and return a Cloudinary URL', async () => {
    const { token } = await createAuthToken();

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', minimalPngBuffer, { filename: 'test.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(res.body.data.public_id).toBeDefined();
  });

  it('should accept a custom folder via query param', async () => {
    const { token } = await createAuthToken();
    const cloudinary = require('../config/cloudinary');

    await request(app)
      .post('/api/upload?folder=soccer-connect/avatars')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', minimalPngBuffer, { filename: 'avatar.png', contentType: 'image/png' });

    const calls = cloudinary.uploader.upload_stream.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0].folder).toBe('soccer-connect/avatars');
  });

  it('should reject files larger than 10 MB', async () => {
    const { token } = await createAuthToken();
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 0); // 11 MB of zeros

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', largeBuffer, { filename: 'big.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
  });

  it('should handle Cloudinary errors gracefully', async () => {
    const cloudinary = require('../config/cloudinary');
    cloudinary.uploader.upload_stream.mockImplementationOnce((_opts, cb) => {
      cb(new Error('Cloudinary connection failed'), null);
      return { end: jest.fn() };
    });

    const { token } = await createAuthToken();

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', minimalPngBuffer, { filename: 'test.png', contentType: 'image/png' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
