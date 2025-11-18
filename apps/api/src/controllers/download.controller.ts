import { Request, Response } from 'express';
import { downloadService } from '../services/download.service';
import { asyncHandler } from '../middleware/error.middleware';

export class DownloadController {
  getDownloads = asyncHandler(async (req: Request, res: Response) => {
    const data = await downloadService.getDownloadLinks(req.params.token);
    res.json(data);
  });
}

export const downloadController = new DownloadController();
