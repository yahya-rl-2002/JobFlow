import request from 'supertest';
import express from 'express';
import { MatchingController } from '../../src/controllers/MatchingController';
import { JobOfferModel } from '../../src/models/JobOffer';
import { CVModel } from '../../src/models/CV';
import { authenticate } from '../../src/middleware/auth';

// Mock dependencies
jest.mock('../../src/models/JobOffer');
jest.mock('../../src/models/CV');
jest.mock('axios');
jest.mock('../../src/middleware/auth', () => ({
    authenticate: (req: any, res: any, next: any) => {
        req.userId = 1;
        next();
    },
}));

const app = express();
app.use(express.json());
app.post('/match', authenticate, MatchingController.matchCVWithJobs);

describe('MatchingController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return match score for valid inputs', async () => {
        // Mock data
        const mockJob = {
            id: 1,
            title: 'Software Engineer',
            description: 'React and Node.js',
            requirements: 'Experience with TypeScript',
            user_id: 1
        };

        const mockCV = {
            id: 1,
            user_id: 1,
            parsed_data: {
                skills: ['React', 'Node.js', 'TypeScript'],
                experience: [],
            },
        };

        (JobOfferModel.findById as jest.Mock).mockResolvedValue(mockJob);
        (CVModel.findById as jest.Mock).mockResolvedValue(mockCV);

        // Mock axios for NLP service
        const mockNlpResponse = {
            data: {
                results: [
                    {
                        job_id: 1,
                        score: 85,
                        details: { skills: 10 }
                    }
                ]
            }
        };
        (require('axios').post as jest.Mock).mockResolvedValue(mockNlpResponse);

        const response = await request(app)
            .post('/match')
            .send({ cv_id: 1, job_ids: [1] });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('results');
        expect(response.body.results[0]).toHaveProperty('score', 85);
    });

    it('should return 404 if CV not found', async () => {
        (CVModel.findById as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .post('/match')
            .send({ cv_id: 999, job_ids: [1] });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'CV not found');
    });
});
