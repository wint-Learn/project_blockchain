/**
 * Public Service Controller
 * Xử lý API công khai cho danh sách dịch vụ
 */

const { listServices: listServicesService } = require('../../services/service-management');
const logger = require('../../config/logger');

/**
 * Lấy danh sách dịch vụ (Public)
 * GET /api/services
 */
async function listServices(req, res) {
    const { pool } = req.app.locals;

    try {
        const { category, isActive } = req.query;

        const filters = {
            category,
            isActive: isActive !== undefined ? isActive === 'true' : true
        };

        const services = await listServicesService(filters, pool, logger);

        return res.status(200).json({
            success: true,
            services,
            count: services.length
        });

    } catch (error) {
        logger.error('List services failed', { error: error.message });
        return res.status(500).json({
            error: 'Lỗi khi lấy danh sách dịch vụ',
            message: error.message
        });
    }
}

module.exports = {
    listServices
};
