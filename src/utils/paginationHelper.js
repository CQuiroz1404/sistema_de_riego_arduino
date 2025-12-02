/**
 * Pagination Helper
 * Provides utility functions for implementing pagination
 */

const PaginationHelper = {
    /**
     * Calculate pagination metadata
     * @param {number} totalItems - Total number of items
     * @param {number} currentPage - Current page number (1-indexed)
     * @param {number} itemsPerPage - Items per page
     * @returns {object} Pagination metadata
     */
    calculate(totalItems, currentPage = 1, itemsPerPage = 10) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const page = Math.max(1, Math.min(currentPage, totalPages));
        const offset = (page - 1) * itemsPerPage;
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
            totalItems,
            totalPages,
            currentPage: page,
            itemsPerPage,
            offset,
            limit: itemsPerPage,
            hasNext,
            hasPrev,
            nextPage: hasNext ? page + 1 : null,
            prevPage: hasPrev ? page - 1 : null,
            startItem: offset + 1,
            endItem: Math.min(offset + itemsPerPage, totalItems)
        };
    },

    /**
     * Build pagination query string for Sequelize
     * @param {object} req - Express request object
     * @param {number} defaultLimit - Default items per page
     * @returns {object} Sequelize query options
     */
    buildQueryOptions(req, defaultLimit = 10) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || defaultLimit;
        const offset = (page - 1) * limit;

        return {
            limit,
            offset,
            page
        };
    },

    /**
     * Format pagination response
     * @param {object} data - Sequelize findAndCountAll result
     * @param {number} currentPage - Current page
     * @param {number} limit - Items per page
     * @returns {object} Formatted response
     */
    formatResponse(data, currentPage, limit) {
        const pagination = this.calculate(data.count, currentPage, limit);

        return {
            success: true,
            data: data.rows,
            pagination: {
                total: pagination.totalItems,
                totalPages: pagination.totalPages,
                currentPage: pagination.currentPage,
                perPage: pagination.itemsPerPage,
                hasNext: pagination.hasNext,
                hasPrev: pagination.hasPrev,
                nextPage: pagination.nextPage,
                prevPage: pagination.prevPage
            }
        };
    },

    /**
     * Generate pagination HTML (for server-side rendering)
     * @param {object} pagination - Pagination metadata
     * @param {string} baseUrl - Base URL for pagination links
     * @returns {string} HTML string
     */
    generateHTML(pagination, baseUrl) {
        if (pagination.totalPages <= 1) return '';

        const { currentPage, totalPages, hasPrev, hasNext } = pagination;
        let html = '<div class="pagination-container flex justify-center items-center gap-2 mt-6">';

        // Previous button
        html += `
            <a href="${baseUrl}?page=${currentPage - 1}" 
               class="pagination-btn ${!hasPrev ? 'disabled' : ''}"
               ${!hasPrev ? 'aria-disabled="true"' : ''}>
                <i class="fas fa-chevron-left"></i>
            </a>
        `;

        // Page numbers
        const pages = this.getPageNumbers(currentPage, totalPages);
        pages.forEach(page => {
            if (page === '...') {
                html += '<span class="pagination-ellipsis">...</span>';
            } else {
                html += `
                    <a href="${baseUrl}?page=${page}" 
                       class="pagination-btn ${page === currentPage ? 'active' : ''}">
                        ${page}
                    </a>
                `;
            }
        });

        // Next button
        html += `
            <a href="${baseUrl}?page=${currentPage + 1}" 
               class="pagination-btn ${!hasNext ? 'disabled' : ''}"
               ${!hasNext ? 'aria-disabled="true"' : ''}>
                <i class="fas fa-chevron-right"></i>
            </a>
        `;

        html += '</div>';
        return html;
    },

    /**
     * Get page numbers to display (with ellipsis for large ranges)
     * @param {number} current - Current page
     * @param {number} total - Total pages
     * @returns {array} Array of page numbers and ellipsis
     */
    getPageNumbers(current, total) {
        const delta = 2; // Number of pages to show on each side
        const pages = [];
        
        for (let i = 1; i <= total; i++) {
            if (
                i === 1 ||
                i === total ||
                (i >= current - delta && i <= current + delta)
            ) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...');
            }
        }

        return pages;
    }
};

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaginationHelper;
}
