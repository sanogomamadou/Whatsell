import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

// Mock Sentry pour éviter les appels réseau dans les tests
jest.mock('@sentry/nestjs', () => ({
  captureException: jest.fn(),
}));

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockRequest: { url: string };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = { url: '/api/v1/test' };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should format HttpException with correct statusCode', () => {
    filter.catch(new HttpException('Non trouvé', HttpStatus.NOT_FOUND), mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
  });

  it('should include error key as HTTP status name for HttpException', () => {
    filter.catch(new HttpException('Non trouvé', HttpStatus.NOT_FOUND), mockHost);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'NOT_FOUND' }),
    );
  });

  it('should include message from HttpException', () => {
    filter.catch(new HttpException('Accès interdit', HttpStatus.FORBIDDEN), mockHost);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Accès interdit' }),
    );
  });

  it('should include path from request URL', () => {
    filter.catch(new HttpException('err', 400), mockHost);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/v1/test' }),
    );
  });

  it('should include timestamp in ISO format', () => {
    filter.catch(new HttpException('err', 400), mockHost);
    const json = mockResponse.json.mock.calls[0][0] as { timestamp: string };
    expect(() => new Date(json.timestamp)).not.toThrow();
    expect(typeof json.timestamp).toBe('string');
    expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should return 500 for non-HttpException', () => {
    filter.catch(new Error('crash inattendu'), mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
  });

  it('should return INTERNAL_SERVER_ERROR error key for non-HttpException', () => {
    filter.catch(new Error('crash'), mockHost);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'INTERNAL_SERVER_ERROR' }),
    );
  });

  it('should return generic message for non-HttpException', () => {
    filter.catch(new Error('crash'), mockHost);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Erreur interne du serveur' }),
    );
  });

  it('should call Sentry.captureException for non-HttpException', () => {
    const { captureException } = jest.requireMock<{
      captureException: jest.Mock;
    }>('@sentry/nestjs');
    const error = new Error('crash sentry');
    filter.catch(error, mockHost);
    expect(captureException).toHaveBeenCalledWith(error);
  });

  it('should NOT call Sentry for 4xx HttpException', () => {
    const { captureException } = jest.requireMock<{
      captureException: jest.Mock;
    }>('@sentry/nestjs');
    captureException.mockClear();
    filter.catch(new HttpException('bad request', 400), mockHost);
    expect(captureException).not.toHaveBeenCalled();
  });

  it('should call Sentry for 5xx HttpException', () => {
    const { captureException } = jest.requireMock<{
      captureException: jest.Mock;
    }>('@sentry/nestjs');
    captureException.mockClear();
    const err = new HttpException('Internal Error', 500);
    filter.catch(err, mockHost);
    expect(captureException).toHaveBeenCalledWith(err);
  });

  it('should call Sentry for 503 HttpException', () => {
    const { captureException } = jest.requireMock<{
      captureException: jest.Mock;
    }>('@sentry/nestjs');
    captureException.mockClear();
    const err = new HttpException('Service Unavailable', 503);
    filter.catch(err, mockHost);
    expect(captureException).toHaveBeenCalledWith(err);
  });

  it('should handle 400 Bad Request correctly', () => {
    filter.catch(new HttpException('Données invalides', HttpStatus.BAD_REQUEST), mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, error: 'BAD_REQUEST' }),
    );
  });

  it('should handle 401 Unauthorized correctly', () => {
    filter.catch(new HttpException('Non autorisé', HttpStatus.UNAUTHORIZED), mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
  });
});
