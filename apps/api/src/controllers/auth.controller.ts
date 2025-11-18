import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../middleware/error.middleware';

export class AuthController {
  signup = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.signup(req.body);
    res.status(201).json(result);
  });

  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.login(req.body);
    res.json(result);
  });

  getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await authService.getProfile(req.userId!);
    res.json(user);
  });

  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await authService.updateProfile(req.userId!, req.body);
    res.json(user);
  });

  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    // In a production app, you'd invalidate the refresh token here
    res.status(204).send();
  });
}

export const authController = new AuthController();
