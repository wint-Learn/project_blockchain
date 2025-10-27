/**
 * User Service Request Controller
 * Xử lý yêu cầu dịch vụ từ người dùng
 */

const { 
  requestService: requestServiceService,
  getUserServices: getUserServicesService
} = require('../../services/service-management');
const logger = require('../../config/logger');

/**
 * User nộp đơn yêu cầu dịch vụ
 * POST /api/services/:id/request
 */
async function requestService(req, res) {
    const { pool } = req.app.locals;

    try {
        const { id } = req.params;
        const { userAddress, requestData } = req.body;

        if (!userAddress || !requestData) {
            return res.status(400).json({
                error: 'Thiếu thông tin',
                message: 'Vui lòng cung cấp userAddress và requestData'
            });
        }

        logger.info('Service request attempt', {
            serviceId: id,
            userAddress: userAddress.slice(0, 10) + '...'
        });

        const result = await requestServiceService(
            userAddress,
            parseInt(id),
            requestData,
            pool,
            logger
        );

        return res.status(200).json({
            success: true,
            message: 'Yêu cầu dịch vụ đã được gửi thành công',
            requestId: result.requestId
        });

    } catch (error) {
        logger.error('Request service failed', { error: error.message });
        return res.status(400).json({
            error: 'Lỗi khi gửi yêu cầu',
            message: error.message
        });
    }
}

/**
 * User xem danh sách dịch vụ của mình
 * GET /api/services/my-services
 */
async function getMyServices(req, res) {
    const { pool } = req.app.locals;

    try {
        const { userAddress } = req.query;

        if (!userAddress) {
            return res.status(400).json({
                error: 'Thiếu thông tin',
                message: 'Vui lòng cung cấp userAddress'
            });
        }

        const services = await getUserServicesService(userAddress, pool, logger);

        return res.status(200).json({
            success: true,
            services,
            count: services.length
        });

    } catch (error) {
        logger.error('Get my services failed', { error: error.message });
        return res.status(500).json({
            error: 'Lỗi khi lấy danh sách dịch vụ',
            message: error.message
        });
    }
}

module.exports = {
    requestService,
    getMyServices
};
