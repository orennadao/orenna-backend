import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { testApp } from './utils/test-server.js';
import { FastifyInstance } from 'fastify';

describe('Projects API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await testApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up projects table
    await app.prisma.project.deleteMany();
    await app.prisma.verificationRound.deleteMany();
    await app.prisma.projectStateHistory.deleteMany();
  });

  describe('POST /projects', () => {
    it('should create a new project', async () => {
      const projectData = {
        ownerAddress: '0x742d35cc6634c0532925a3b8d0c9d3fe2b2b1b5d',
        tokenUri: 'ipfs://QmTest1',
        registryDataUri: 'ipfs://QmTest2',
        dataHash: '0x1234567890abcdef',
        chainId: 1
      };

      const response = await app.inject({
        method: 'POST',
        url: '/projects',
        payload: projectData
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.body);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        ownerAddress: projectData.ownerAddress.toLowerCase(),
        tokenUri: projectData.tokenUri,
        registryDataUri: projectData.registryDataUri,
        dataHash: projectData.dataHash,
        chainId: projectData.chainId,
        state: 'DRAFT'
      });
      expect(result.data.id).toBeDefined();
      expect(result.data.tokenId).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/projects',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.body);
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation');
    });

    it('should validate chainId', async () => {
      const projectData = {
        ownerAddress: '0x742d35cc6634c0532925a3b8d0c9d3fe2b2b1b5d',
        tokenUri: 'ipfs://QmTest1',
        registryDataUri: 'ipfs://QmTest2',
        dataHash: '0x1234567890abcdef',
        chainId: 'invalid'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/projects',
        payload: projectData
      });

      expect(response.statusCode).toBe(400);
    });

    it('should normalize owner address to lowercase', async () => {
      const projectData = {
        ownerAddress: '0x742D35CC6634C0532925A3B8D0C9D3FE2B2B1B5D',
        tokenUri: 'ipfs://QmTest1',
        registryDataUri: 'ipfs://QmTest2',
        dataHash: '0x1234567890abcdef',
        chainId: 1
      };

      const response = await app.inject({
        method: 'POST',
        url: '/projects',
        payload: projectData
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.body);
      expect(result.data.ownerAddress).toBe(projectData.ownerAddress.toLowerCase());
    });
  });

  describe('GET /projects/:id', () => {
    it('should get a project by id', async () => {
      // Create a project first
      const project = await app.prisma.project.create({
        data: {
          chainId: 1,
          tokenId: 1,
          ownerAddress: '0x742d35cc6634c0532925a3b8d0c9d3fe2b2b1b5d',
          state: 'DRAFT',
          tokenUri: 'ipfs://QmTest1',
          registryDataUri: 'ipfs://QmTest2',
          dataHash: '0x1234567890abcdef',
          schemaVersion: 1
        }
      });

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${project.id}`
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: project.id.toString(),
        tokenId: project.tokenId.toString(),
        ownerAddress: project.ownerAddress,
        state: 'DRAFT'
      });
    });

    it('should return 404 for non-existent project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/projects/999'
      });

      expect(response.statusCode).toBe(404);
      const result = JSON.parse(response.body);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should include related data', async () => {
      // Create a project
      const project = await app.prisma.project.create({
        data: {
          chainId: 1,
          tokenId: 1,
          ownerAddress: '0x742d35cc6634c0532925a3b8d0c9d3fe2b2b1b5d',
          state: 'VERIFIED_ROUND',
          tokenUri: 'ipfs://QmTest1',
          registryDataUri: 'ipfs://QmTest2',
          dataHash: '0x1234567890abcdef',
          schemaVersion: 1
        }
      });

      // Add verification round
      await app.prisma.verificationRound.create({
        data: {
          projectId: project.id,
          round: 1,
          reportHash: '0xreport123',
          reportURI: 'ipfs://QmReport1',
          attestor: 'verifier1'
        }
      });

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${project.id}`
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.data.verificationRounds).toHaveLength(1);
      expect(result.data.verificationRounds[0]).toMatchObject({
        round: 1,
        reportHash: '0xreport123',
        reportURI: 'ipfs://QmReport1'
      });
    });
  });

  describe('GET /projects', () => {
    it('should list projects with pagination', async () => {
      // Create multiple projects
      for (let i = 1; i <= 5; i++) {
        await app.prisma.project.create({
          data: {
            chainId: 1,
            tokenId: i,
            ownerAddress: `0x742d35cc6634c0532925a3b8d0c9d3fe2b2b1b5${i}`,
            state: 'DRAFT',
            tokenUri: `ipfs://QmTest${i}`,
            registryDataUri: `ipfs://QmRegistry${i}`,
            dataHash: `0x123456789${i}`,
            schemaVersion: 1
          }
        });
      }

      const response = await app.inject({
        method: 'GET',
        url: '/projects?limit=3&offset=0'
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.success).toBe(true);
      expect(result.data.projects).toHaveLength(3);
      expect(result.data.total).toBe(5);
      expect(result.data.limit).toBe(3);
      expect(result.data.offset).toBe(0);
    });

    it('should filter projects by state', async () => {
      await app.prisma.project.createMany({
        data: [
          {
            chainId: 1,
            tokenId: 1,
            ownerAddress: '0x742d35cc6634c0532925a3b8d0c9d3fe2b2b1b51',
            state: 'DRAFT',
            tokenUri: 'ipfs://QmTest1',
            registryDataUri: 'ipfs://QmRegistry1',
            dataHash: '0x1234567891',
            schemaVersion: 1
          },
          {
            chainId: 1,
            tokenId: 2,
            ownerAddress: '0x742d35cc6634c0532925a3b8d0c9d3fe2b2b1b52',
            state: 'ACTIVE_FUNDRAISING',
            tokenUri: 'ipfs://QmTest2',
            registryDataUri: 'ipfs://QmRegistry2',
            dataHash: '0x1234567892',
            schemaVersion: 1
          }
        ]
      });

      const response = await app.inject({
        method: 'GET',
        url: '/projects?state=ACTIVE_FUNDRAISING'
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.data.projects).toHaveLength(1);
      expect(result.data.projects[0].state).toBe('ACTIVE_FUNDRAISING');
    });

    it('should filter projects by owner', async () => {
      const ownerAddress = '0x742d35cc6634c0532925a3b8d0c9d3fe2b2b1b5d';
      
      await app.prisma.project.createMany({
        data: [
          {
            chainId: 1,
            tokenId: 1,
            ownerAddress,
            state: 'DRAFT',
            tokenUri: 'ipfs://QmTest1',
            registryDataUri: 'ipfs://QmRegistry1',
            dataHash: '0x1234567891',
            schemaVersion: 1
          },
          {
            chainId: 1,
            tokenId: 2,
            ownerAddress: '0x742d35cc6634c0532925a3b8d0c9d3fe2b2b1b52',
            state: 'DRAFT',
            tokenUri: 'ipfs://QmTest2',
            registryDataUri: 'ipfs://QmRegistry2',
            dataHash: '0x1234567892',
            schemaVersion: 1
          }
        ]
      });

      const response = await app.inject({
        method: 'GET',
        url: `/projects?owner=${ownerAddress}`
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.data.projects).toHaveLength(1);
      expect(result.data.projects[0].ownerAddress).toBe(ownerAddress);
    });
  });

  describe('PATCH /projects/:id/state', () => {
    it('should update project state', async () => {
      const project = await app.prisma.project.create({
        data: {
          chainId: 1,
          tokenId: 1,
          ownerAddress: '0x742d35cc6634c0532925a3b8d0c9d3fe2b2b1b5d',
          state: 'DRAFT',
          tokenUri: 'ipfs://QmTest1',
          registryDataUri: 'ipfs://QmTest2',
          dataHash: '0x1234567890abcdef',
          schemaVersion: 1
        }
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/projects/${project.id}/state`,
        payload: { state: 'BASELINED' }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.success).toBe(true);
      expect(result.data.state).toBe('BASELINED');

      // Check that state history was created
      const stateHistory = await app.prisma.projectStateHistory.findMany({
        where: { projectId: project.id }
      });
      expect(stateHistory).toHaveLength(1);
      expect(stateHistory[0].fromState).toBe('DRAFT');
      expect(stateHistory[0].toState).toBe('BASELINED');
    });

    it('should validate state transitions', async () => {
      const project = await app.prisma.project.create({
        data: {
          chainId: 1,
          tokenId: 1,
          ownerAddress: '0x742d35cc6634c0532925a3b8d0c9d3fe2b2b1b5d',
          state: 'DRAFT',
          tokenUri: 'ipfs://QmTest1',
          registryDataUri: 'ipfs://QmTest2',
          dataHash: '0x1234567890abcdef',
          schemaVersion: 1
        }
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/projects/${project.id}/state`,
        payload: { state: 'INVALID_STATE' }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PATCH /projects/:id/uris', () => {
    it('should update project URIs', async () => {
      const project = await app.prisma.project.create({
        data: {
          chainId: 1,
          tokenId: 1,
          ownerAddress: '0x742d35cc6634c0532925a3b8d0c9d3fe2b2b1b5d',
          state: 'DRAFT',
          tokenUri: 'ipfs://QmTest1',
          registryDataUri: 'ipfs://QmTest2',
          dataHash: '0x1234567890abcdef',
          schemaVersion: 1
        }
      });

      const newData = {
        tokenUri: 'ipfs://QmNewTest1',
        registryDataUri: 'ipfs://QmNewTest2',
        dataHash: '0xnewdatahash'
      };

      const response = await app.inject({
        method: 'PATCH',
        url: `/projects/${project.id}/uris`,
        payload: newData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject(newData);
    });
  });

  describe('POST /projects/:id/attest', () => {
    it('should create verification attestation', async () => {
      const project = await app.prisma.project.create({
        data: {
          chainId: 1,
          tokenId: 1,
          ownerAddress: '0x742d35cc6634c0532925a3b8d0c9d3fe2b2b1b5d',
          state: 'MONITORING',
          tokenUri: 'ipfs://QmTest1',
          registryDataUri: 'ipfs://QmTest2',
          dataHash: '0x1234567890abcdef',
          schemaVersion: 1
        }
      });

      const attestationData = {
        round: 1,
        reportHash: '0xreporthashabc',
        reportURI: 'ipfs://QmReport1',
        attestor: 'verifier1'
      };

      const response = await app.inject({
        method: 'POST',
        url: `/projects/${project.id}/attest`,
        payload: attestationData
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.body);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        projectId: project.id.toString(),
        round: 1,
        reportHash: '0xreporthashabc',
        reportURI: 'ipfs://QmReport1',
        attestor: 'verifier1'
      });
    });

    it('should prevent duplicate attestations for same round', async () => {
      const project = await app.prisma.project.create({
        data: {
          chainId: 1,
          tokenId: 1,
          ownerAddress: '0x742d35cc6634c0532925a3b8d0c9d3fe2b2b1b5d',
          state: 'MONITORING',
          tokenUri: 'ipfs://QmTest1',
          registryDataUri: 'ipfs://QmTest2',
          dataHash: '0x1234567890abcdef',
          schemaVersion: 1
        }
      });

      // Create first attestation
      await app.prisma.verificationRound.create({
        data: {
          projectId: project.id,
          round: 1,
          reportHash: '0xfirst',
          reportURI: 'ipfs://QmFirst',
          attestor: 'verifier1'
        }
      });

      const response = await app.inject({
        method: 'POST',
        url: `/projects/${project.id}/attest`,
        payload: {
          round: 1,
          reportHash: '0xsecond',
          reportURI: 'ipfs://QmSecond',
          attestor: 'verifier2'
        }
      });

      expect(response.statusCode).toBe(409);
      const result = JSON.parse(response.body);
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('GET /projects/:id/metrics', () => {
    it('should return project metrics', async () => {
      const project = await app.prisma.project.create({
        data: {
          chainId: 1,
          tokenId: 1,
          ownerAddress: '0x742d35cc6634c0532925a3b8d0c9d3fe2b2b1b5d',
          state: 'ACTIVE_FUNDRAISING',
          tokenUri: 'ipfs://QmTest1',
          registryDataUri: 'ipfs://QmTest2',
          dataHash: '0x1234567890abcdef',
          schemaVersion: 1
        }
      });

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${project.id}/metrics`
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('fundsRaised');
      expect(result.data).toHaveProperty('liftMinted');
      expect(result.data).toHaveProperty('liftRetired');
      expect(result.data).toHaveProperty('verificationRounds');
    });
  });

  describe('GET /projects/:id/verification', () => {
    it('should return verification history', async () => {
      const project = await app.prisma.project.create({
        data: {
          chainId: 1,
          tokenId: 1,
          ownerAddress: '0x742d35cc6634c0532925a3b8d0c9d3fe2b2b1b5d',
          state: 'VERIFIED_ROUND',
          tokenUri: 'ipfs://QmTest1',
          registryDataUri: 'ipfs://QmTest2',
          dataHash: '0x1234567890abcdef',
          schemaVersion: 1
        }
      });

      // Add verification rounds
      await app.prisma.verificationRound.createMany({
        data: [
          {
            projectId: project.id,
            round: 1,
            reportHash: '0xround1',
            reportURI: 'ipfs://QmRound1',
            attestor: 'verifier1'
          },
          {
            projectId: project.id,
            round: 2,
            reportHash: '0xround2',
            reportURI: 'ipfs://QmRound2',
            attestor: 'verifier2'
          }
        ]
      });

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${project.id}/verification`
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.success).toBe(true);
      expect(result.data.rounds).toHaveLength(2);
      expect(result.data.rounds[0].round).toBe(1);
      expect(result.data.rounds[1].round).toBe(2);
    });
  });
});