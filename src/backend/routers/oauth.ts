import { Hono } from 'hono';
import { Database } from '../models/database';
import { CloudflareBindings, MemberInfo } from '../models/types';
import { OAuthService } from '../services/oauth';
import { AuthService } from '../services/auth';
import { GoogleAPIService } from '../services/google-api';

const oauthRouter = new Hono<{ Bindings: CloudflareBindings }>();

interface TokenRequest {
  grant_type: 'password';
  client_id: string;
  client_secret: string;
  username: string;
  password: string;
  scope?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope?: string;
}

/**
 * OAuth 2.0 Token Endpoint
 * Implements Resource Owner Password Flow
 * External services must provide:
 * - client_id and client_secret (service credentials)
 * - username and password (user credentials)
 */
oauthRouter.post('/token', async (c) => {
  try {
    const body = await c.req.json<TokenRequest>();

    // Validate required fields
    if (!body.grant_type || body.grant_type !== 'password') {
      return c.json(
        {
          error: 'unsupported_grant_type',
          error_description: 'Only password grant type is supported',
        },
        400
      );
    }

    if (!body.client_id || !body.client_secret) {
      return c.json(
        {
          error: 'invalid_request',
          error_description: 'client_id and client_secret are required',
        },
        400
      );
    }

    if (!body.username || !body.password) {
      return c.json(
        {
          error: 'invalid_request',
          error_description: 'username and password are required',
        },
        400
      );
    }

    const db = new Database(c.env.DB);
    const oauthService = new OAuthService(db, c.env.OAUTH_JWT_SECRET);

    // Log the token request
    await db.createLog({
      user: body.client_id,
      action: 'oauth_token_request',
      status: 'pending',
    });

    // Step 1: Authenticate OAuth client (service)
    const client = await oauthService.authenticateClient(body.client_id, body.client_secret);

    if (!client) {
      await db.createLog({
        user: body.client_id,
        action: 'oauth_client_auth',
        status: 'failed',
      });

      return c.json(
        {
          error: 'invalid_client',
          error_description: 'Invalid client credentials',
        },
        401
      );
    }

    await db.createLog({
      user: body.client_id,
      action: 'oauth_client_auth',
      status: 'success',
    });

    // Step 2: Authenticate user credentials
    const googleCredentials =
      typeof c.env.GOOGLE_API_KEY === 'string'
        ? JSON.parse(c.env.GOOGLE_API_KEY)
        : c.env.GOOGLE_API_KEY;
    const googleService = new GoogleAPIService(googleCredentials);
    const authService = new AuthService(db, googleService, c.env.JWT_SECRET);

    const authResult = await authService.authenticateMember(body.username, body.password);

    if (!authResult) {
      await db.createLog({
        user: body.client_id,
        action: 'oauth_user_auth',
        status: 'failed',
      });

      return c.json(
        {
          error: 'invalid_grant',
          error_description: 'Invalid user credentials',
        },
        401
      );
    }

    await db.createLog({
      user: body.username,
      action: 'oauth_user_auth',
      status: 'success',
    });

    // Step 3: Generate access token
    const expiresIn = 3600; // 1 hour
    const accessToken = await oauthService.generateAccessToken(
      authResult.user,
      client.client_id,
      expiresIn
    );

    await db.createLog({
      user: body.username,
      action: 'oauth_token_issued',
      status: 'success',
    });

    const response: TokenResponse = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      scope: body.scope || 'user_info',
    };

    return c.json(response);
  } catch (error) {
    console.error('OAuth token error:', error);
    return c.json(
      {
        error: 'server_error',
        error_description: 'Internal server error',
      },
      500
    );
  }
});

/**
 * OAuth 2.0 User Info Endpoint
 * Returns full user profile information
 * Requires valid access token in Authorization header
 */
oauthRouter.get('/user-info', async (c) => {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        {
          error: 'invalid_token',
          error_description: 'Missing or invalid Authorization header',
        },
        401
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    const db = new Database(c.env.DB);
    const oauthService = new OAuthService(db, c.env.OAUTH_JWT_SECRET);

    // Verify and decode token
    const payload = await oauthService.verifyAccessToken(token);

    if (!payload) {
      return c.json(
        {
          error: 'invalid_token',
          error_description: 'Token is invalid or expired',
        },
        401
      );
    }

    // Get user from database
    const user = await db.getUserById(payload.sub);
    if (!user) {
      return c.json(
        {
          error: 'invalid_token',
          error_description: 'User not found',
        },
        404
      );
    }

    // Get full profile from Google Sheet
    const sheetConfig = await db.getGoogleSheet();
    if (!sheetConfig) {
      return c.json(
        {
          error: 'configuration_error',
          error_description: 'Google Sheet configuration not found',
        },
        500
      );
    }

    const googleCredentials =
      typeof c.env.GOOGLE_API_KEY === 'string'
        ? JSON.parse(c.env.GOOGLE_API_KEY)
        : c.env.GOOGLE_API_KEY;
    const googleService = new GoogleAPIService(googleCredentials);

    const member = await googleService.findMemberByIdentifier(
      sheetConfig.google_sheet_id,
      user.membership_number,
      sheetConfig.corresponding_values
    );

    if (!member) {
      // Fallback to basic user info if sheet data not available
      const fallbackProfile = {
        membership_number: user.membership_number,
        email: user.email,
        latin_name: user.latin_name || '',
        phone: user.phone || '',
        whatsapp: user.whatsapp || '',
        role: user.role,
        status: user.status,
      };

      await db.createLog({
        user: user.membership_number,
        action: 'oauth_user_info_access',
        status: 'success',
      });

      return c.json({
        success: true,
        user: fallbackProfile,
      });
    }

    // Remove password from response
    const { password, ...userInfo } = member;

    await db.createLog({
      user: user.membership_number,
      action: 'oauth_user_info_access',
      status: 'success',
    });

    return c.json({
      success: true,
      user: userInfo,
    });
  } catch (error) {
    console.error('OAuth user info error:', error);
    return c.json(
      {
        error: 'server_error',
        error_description: 'Internal server error',
      },
      500
    );
  }
});

/**
 * Token Introspection Endpoint (Optional - for debugging)
 * Allows clients to check if a token is valid
 */
oauthRouter.post('/introspect', async (c) => {
  try {
    const body = await c.req.json<{ token: string; client_id: string; client_secret: string }>();

    if (!body.token || !body.client_id || !body.client_secret) {
      return c.json(
        {
          error: 'invalid_request',
          error_description: 'token, client_id, and client_secret are required',
        },
        400
      );
    }

    const db = new Database(c.env.DB);
    const oauthService = new OAuthService(db, c.env.OAUTH_JWT_SECRET);

    // Authenticate client
    const client = await oauthService.authenticateClient(body.client_id, body.client_secret);
    if (!client) {
      return c.json(
        {
          error: 'invalid_client',
          error_description: 'Invalid client credentials',
        },
        401
      );
    }

    // Verify token
    const payload = await oauthService.verifyAccessToken(body.token);

    if (!payload) {
      return c.json({
        active: false,
      });
    }

    return c.json({
      active: true,
      client_id: payload.client_id,
      username: payload.membership_number,
      scope: 'user_info',
      exp: payload.exp,
      iat: payload.iat,
    });
  } catch (error) {
    console.error('Token introspection error:', error);
    return c.json(
      {
        error: 'server_error',
        error_description: 'Internal server error',
      },
      500
    );
  }
});

export { oauthRouter };
