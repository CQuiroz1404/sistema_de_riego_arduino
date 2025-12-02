const { describe, test, expect } = require('@jest/globals');
const PaginationHelper = require('../../src/utils/paginationHelper');

describe('Pagination Helper', () => {
    describe('calculate', () => {
        test('should calculate pagination for first page', () => {
            const result = PaginationHelper.calculate(100, 1, 10);

            expect(result).toEqual({
                totalItems: 100,
                totalPages: 10,
                currentPage: 1,
                itemsPerPage: 10,
                offset: 0,
                limit: 10,
                hasNext: true,
                hasPrev: false,
                nextPage: 2,
                prevPage: null,
                startItem: 1,
                endItem: 10
            });
        });

        test('should calculate pagination for middle page', () => {
            const result = PaginationHelper.calculate(100, 5, 10);

            expect(result).toEqual({
                totalItems: 100,
                totalPages: 10,
                currentPage: 5,
                itemsPerPage: 10,
                offset: 40,
                limit: 10,
                hasNext: true,
                hasPrev: true,
                nextPage: 6,
                prevPage: 4,
                startItem: 41,
                endItem: 50
            });
        });

        test('should calculate pagination for last page', () => {
            const result = PaginationHelper.calculate(100, 10, 10);

            expect(result).toEqual({
                totalItems: 100,
                totalPages: 10,
                currentPage: 10,
                itemsPerPage: 10,
                offset: 90,
                limit: 10,
                hasNext: false,
                hasPrev: true,
                nextPage: null,
                prevPage: 9,
                startItem: 91,
                endItem: 100
            });
        });

        test('should handle partial last page', () => {
            const result = PaginationHelper.calculate(95, 10, 10);

            expect(result.endItem).toBe(95);
            expect(result.totalPages).toBe(10);
        });

        test('should handle page number out of bounds', () => {
            const result = PaginationHelper.calculate(50, 100, 10);

            expect(result.currentPage).toBe(5); // Should clamp to max page
            expect(result.hasNext).toBe(false);
        });

        test('should handle zero page number', () => {
            const result = PaginationHelper.calculate(50, 0, 10);

            expect(result.currentPage).toBe(1); // Should default to page 1
        });
    });

    describe('getPageNumbers', () => {
        test('should return all pages for small range', () => {
            const pages = PaginationHelper.getPageNumbers(3, 5);

            expect(pages).toEqual([1, 2, 3, 4, 5]);
        });

        test('should use ellipsis for large range', () => {
            const pages = PaginationHelper.getPageNumbers(5, 20);

            expect(pages).toContain(1);
            expect(pages).toContain(20);
            expect(pages).toContain('...');
            expect(pages).toContain(5); // Current page
        });

        test('should show pages near current', () => {
            const pages = PaginationHelper.getPageNumbers(10, 20);

            expect(pages).toContain(8);
            expect(pages).toContain(9);
            expect(pages).toContain(10);
            expect(pages).toContain(11);
            expect(pages).toContain(12);
        });
    });

    describe('buildQueryOptions', () => {
        test('should parse query parameters correctly', () => {
            const req = {
                query: {
                    page: '3',
                    limit: '20'
                }
            };

            const result = PaginationHelper.buildQueryOptions(req);

            expect(result).toEqual({
                limit: 20,
                offset: 40,
                page: 3
            });
        });

        test('should use defaults for missing parameters', () => {
            const req = {
                query: {}
            };

            const result = PaginationHelper.buildQueryOptions(req);

            expect(result).toEqual({
                limit: 10,
                offset: 0,
                page: 1
            });
        });

        test('should handle invalid parameters', () => {
            const req = {
                query: {
                    page: 'invalid',
                    limit: 'invalid'
                }
            };

            const result = PaginationHelper.buildQueryOptions(req);

            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });
    });

    describe('formatResponse', () => {
        test('should format Sequelize response correctly', () => {
            const data = {
                count: 100,
                rows: [{ id: 1 }, { id: 2 }]
            };

            const result = PaginationHelper.formatResponse(data, 1, 10);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(data.rows);
            expect(result.pagination.total).toBe(100);
            expect(result.pagination.currentPage).toBe(1);
            expect(result.pagination.perPage).toBe(10);
        });
    });
});
