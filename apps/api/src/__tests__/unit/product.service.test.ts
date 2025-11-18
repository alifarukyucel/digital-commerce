import { ProductService } from '../../services/product.service';
import { prisma } from '@commerce/database';
import { ApiError } from '../../middleware/error.middleware';

jest.mock('@commerce/database');
jest.mock('../../services/storage.service');

describe('ProductService Unit Tests', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    const userId = 'user-123';
    const productData = {
      title: 'Test Product',
      slug: 'test-product',
      description: 'A test product',
      priceCents: 2999,
      currency: 'USD',
      productType: 'download',
    };

    it('should create product successfully', async () => {
      const mockProduct = {
        id: 'product-123',
        userId,
        ...productData,
        coverImageUrl: null,
        isPublished: false,
        salesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productService.createProduct(userId, productData);

      expect(result.title).toBe(productData.title);
      expect(result.slug).toBe(productData.slug);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          title: productData.title,
          slug: productData.slug,
        }),
      });
    });

    it('should throw error if slug already exists for user', async () => {
      const existingProduct = { id: 'existing-123', userId, slug: productData.slug };
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(existingProduct);

      await expect(productService.createProduct(userId, productData)).rejects.toThrow(ApiError);
      await expect(productService.createProduct(userId, productData)).rejects.toThrow('Product slug already exists');
    });
  });

  describe('listProducts', () => {
    const userId = 'user-123';

    it('should return paginated products', async () => {
      const mockProducts = [
        { id: '1', title: 'Product 1', userId, isPublished: true },
        { id: '2', title: 'Product 2', userId, isPublished: false },
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(2);

      const result = await productService.listProducts(userId, { page: 1, limit: 20 });

      expect(result.products).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter by published status', async () => {
      const mockProducts = [{ id: '1', title: 'Product 1', isPublished: true }];

      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);

      await productService.listProducts(userId, { status: 'published' });

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ isPublished: true }),
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { files: true },
      });
    });
  });
});
