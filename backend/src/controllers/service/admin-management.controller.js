/**
 * Admin Service Management Controller
 * Xử lý quản lý dịch vụ và phê duyệt từ admin
 */

const {
  createService: createServiceService,
  getServiceRequests: getServiceRequestsService,
  approveServiceRequest: approveServiceRequestService,
  rejectServiceRequest: rejectServiceRequestService
} = require('../../services/service-management');
const logger = require('../../config/logger');

/**
 * Admin tạo dịch vụ mới
 * POST /api/admin/services/create
 */
async function createService(req, res) {
    const { pool } = req.app.locals;

    try {
        const { name, description, category, requiresVerification, metadata } = req.body;

        if (!name || !description || !category) {
            return res.status(400).json({
                error: 'Thiếu thông tin',
                message: 'Vui lòng cung cấp name, description, category'
            });
        }

        logger.info('Admin creating service', {
            admin: req.admin?.username,
            name,
            category
        });

        const result = await createServiceService(
            { name, description, category, requiresVerification, metadata },
            pool,
            logger
        );

        return res.status(201).json({
            success: true,
            message: 'Dịch vụ đã được tạo thành công',
            serviceId: result.serviceId
        });

    } catch (error) {
        logger.error('Create service failed', { error: error.message });
        return res.status(500).json({
            error: 'Lỗi khi tạo dịch vụ',
            message: error.message
        });
    }
}

/**
 * Admin xem tất cả service requests
 * GET /api/admin/services/requests
 */
async function getServiceRequests(req, res) {
    const { pool } = req.app.locals;

    try {
        const { status, serviceId, limit, offset } = req.query;

        const filters = {
            status,
            serviceId: serviceId ? parseInt(serviceId) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        };

        logger.info('Admin viewing service requests', {
            admin: req.admin?.username,
            filters
        });

        const result = await getServiceRequestsService(filters, pool, logger);

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        logger.error('Get service requests failed', { error: error.message });
        return res.status(500).json({
            error: 'Lỗi khi lấy danh sách yêu cầu',
            message: error.message
        });
    }
}

/**
 * Admin duyệt service request
 * PUT /api/admin/services/requests/:id/approve
 */
async function approveServiceRequest(req, res) {
    const { pool, contract } = req.app.locals;
    const ethers = require('ethers');

    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        logger.info('Admin approving service request', {
            admin: req.admin?.username,
            requestId: id
        });

        const adminId = req.admin?.id || 1;
        
        // Load admin wallet
        let adminWallet = null;
        
        try {
            const adminResult = await pool.query(
                'SELECT wallet_address FROM admin_users WHERE id = $1',
                [adminId]
            );
            
            if (adminResult.rows.length > 0 && adminResult.rows[0].wallet_address) {
                const adminAddress = adminResult.rows[0].wallet_address;
                const privateKeyEnvVar = `ADMIN_WALLET_PRIVATE_KEY_${adminId}`;
                const privateKey = process.env[privateKeyEnvVar];
                
                if (privateKey) {
                    const provider = contract.provider;
                    adminWallet = new ethers.Wallet(privateKey, provider);
                    logger.info('Admin wallet loaded', {
                        adminId,
                        walletAddress: adminWallet.address
                    });
                } else {
                    logger.warn(`Admin private key not found in env var: ${privateKeyEnvVar}`);
                }
            } else {
                logger.warn('Admin does not have wallet_address in database', { adminId });
            }
        } catch (walletError) {
            logger.error('Failed to load admin wallet', {
                error: walletError.message,
                adminId
            });
        }
        
        const result = await approveServiceRequestService(
            parseInt(id),
            adminId,
            adminNotes || 'Đã được phê duyệt',
            pool,
            contract,
            adminWallet,
            logger
        );

        return res.status(200).json({
            success: true,
            message: 'Yêu cầu đã được phê duyệt',
            txHash: result.txHash || null
        });

    } catch (error) {
        logger.error('Approve service request failed', { error: error.message });
        return res.status(400).json({
            error: 'Lỗi khi duyệt yêu cầu',
            message: error.message
        });
    }
}

/**
 * Admin từ chối service request
 * PUT /api/admin/services/requests/:id/reject
 */
async function rejectServiceRequest(req, res) {
    const { pool } = req.app.locals;

    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                error: 'Thiếu thông tin',
                message: 'Vui lòng cung cấp lý do từ chối'
            });
        }

        logger.info('Admin rejecting service request', {
            admin: req.admin?.username,
            requestId: id,
            reason
        });

        const adminId = req.admin?.id || 1;
        const result = await rejectServiceRequestService(
            parseInt(id),
            adminId,
            reason,
            pool,
            logger
        );

        return res.status(200).json({
            success: true,
            message: 'Yêu cầu đã bị từ chối'
        });

    } catch (error) {
        logger.error('Reject service request failed', { error: error.message });
        return res.status(400).json({
            error: 'Lỗi khi từ chối yêu cầu',
            message: error.message
        });
    }
}

module.exports = {
    createService,
    getServiceRequests,
    approveServiceRequest,
    rejectServiceRequest
};
