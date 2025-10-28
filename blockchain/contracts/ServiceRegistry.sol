// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ServiceRegistry
 * @dev Quản lý đăng ký dịch vụ công (đăng ký kinh doanh, xe máy, v.v.)
 */
contract ServiceRegistry {
    // Cấu trúc thông tin dịch vụ
    struct ServiceRecord {
        bytes32 cccdHash;           // Hash của số CCCD
        string serviceType;         // Loại dịch vụ: "business_registration", "vehicle_registration"
        string data;                // Dữ liệu JSON của dịch vụ
        uint256 timestamp;          // Thời gian đăng ký
        address approvedBy;         // Admin phê duyệt
        bool isActive;              // Trạng thái kích hoạt
    }

    // Mapping: address => serviceId => ServiceRecord
    mapping(address => mapping(uint256 => ServiceRecord)) public serviceRecords;
    
    // Mapping: address => số lượng dịch vụ đã đăng ký
    mapping(address => uint256) public serviceCount;
    
    // Mapping: cccdHash => address (để tra cứu)
    mapping(bytes32 => address) public cccdToAddress;
    
    // Admin có quyền phê duyệt
    mapping(address => bool) public isAdmin;
    
    // Contract owner
    address public owner;
    
    // Events
    event ServiceRegistered(
        address indexed user,
        uint256 indexed serviceId,
        bytes32 cccdHash,
        string serviceType,
        uint256 timestamp
    );
    
    event ServiceApproved(
        address indexed user,
        uint256 indexed serviceId,
        address approvedBy,
        uint256 timestamp
    );
    
    event ServiceRevoked(
        address indexed user,
        uint256 indexed serviceId,
        uint256 timestamp
    );
    
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAdmin() {
        require(isAdmin[msg.sender] || msg.sender == owner, "Only admin can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        isAdmin[msg.sender] = true; // Owner là admin mặc định
    }
    
    /**
     * @dev Thêm admin mới
     */
    function addAdmin(address _admin) public onlyOwner {
        require(_admin != address(0), "Invalid admin address");
        isAdmin[_admin] = true;
        emit AdminAdded(_admin);
    }
    
    /**
     * @dev Xóa admin
     */
    function removeAdmin(address _admin) public onlyOwner {
        isAdmin[_admin] = false;
        emit AdminRemoved(_admin);
    }
    
    /**
     * @dev Đăng ký dịch vụ công (được gọi bởi admin sau khi phê duyệt)
     * @param _userAddress Địa chỉ ví người dùng
     * @param _cccdHash Hash CCCD
     * @param _serviceType Loại dịch vụ
     * @param _data Dữ liệu dịch vụ (JSON string)
     */
    function registerService(
        address _userAddress,
        bytes32 _cccdHash,
        string memory _serviceType,
        string memory _data
    ) public onlyAdmin returns (uint256) {
        require(_userAddress != address(0), "Invalid user address");
        require(_cccdHash != bytes32(0), "Invalid CCCD hash");
        require(bytes(_serviceType).length > 0, "Service type required");
        
        uint256 serviceId = serviceCount[_userAddress];
        
        serviceRecords[_userAddress][serviceId] = ServiceRecord({
            cccdHash: _cccdHash,
            serviceType: _serviceType,
            data: _data,
            timestamp: block.timestamp,
            approvedBy: msg.sender,
            isActive: true
        });
        
        serviceCount[_userAddress]++;
        cccdToAddress[_cccdHash] = _userAddress;
        
        emit ServiceRegistered(_userAddress, serviceId, _cccdHash, _serviceType, block.timestamp);
        emit ServiceApproved(_userAddress, serviceId, msg.sender, block.timestamp);
        
        return serviceId;
    }
    
    /**
     * @dev Thu hồi dịch vụ (vô hiệu hóa)
     */
    function revokeService(address _userAddress, uint256 _serviceId) public onlyAdmin {
        require(_serviceId < serviceCount[_userAddress], "Service not found");
        require(serviceRecords[_userAddress][_serviceId].isActive, "Service already revoked");
        
        serviceRecords[_userAddress][_serviceId].isActive = false;
        
        emit ServiceRevoked(_userAddress, _serviceId, block.timestamp);
    }
    
    /**
     * @dev Lấy thông tin dịch vụ
     */
    function getService(address _userAddress, uint256 _serviceId) 
        public 
        view 
        returns (
            bytes32 cccdHash,
            string memory serviceType,
            string memory data,
            uint256 timestamp,
            address approvedBy,
            bool isActive
        ) 
    {
        require(_serviceId < serviceCount[_userAddress], "Service not found");
        
        ServiceRecord memory record = serviceRecords[_userAddress][_serviceId];
        return (
            record.cccdHash,
            record.serviceType,
            record.data,
            record.timestamp,
            record.approvedBy,
            record.isActive
        );
    }
    
    /**
     * @dev Lấy tất cả dịch vụ của user
     */
    function getUserServiceCount(address _userAddress) public view returns (uint256) {
        return serviceCount[_userAddress];
    }
    
    /**
     * @dev Tìm địa chỉ ví theo CCCD hash
     */
    function getAddressByCCCD(bytes32 _cccdHash) public view returns (address) {
        return cccdToAddress[_cccdHash];
    }
    
    /**
     * @dev Kiểm tra user có dịch vụ loại nào đó không
     */
    function hasServiceType(address _userAddress, string memory _serviceType) public view returns (bool) {
        uint256 count = serviceCount[_userAddress];
        for (uint256 i = 0; i < count; i++) {
            ServiceRecord memory record = serviceRecords[_userAddress][i];
            if (record.isActive && keccak256(bytes(record.serviceType)) == keccak256(bytes(_serviceType))) {
                return true;
            }
        }
        return false;
    }
}
