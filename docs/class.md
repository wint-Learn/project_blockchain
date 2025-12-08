https://editor.plantuml.com/

Class Diagram

@startuml

class User {
  - id: integer
  - wallet_address: text
  - cccd_hash: text
  - cccd_number_hash: text
  - encrypted_cccd_data: text
  - is_locked boolean	
  - locked_reason text
  - locked_at	timestamp	
  - created_at: timestamp
  - updated_at: timestamp
  
  + registerDID(): void
  + getUserByWallet(): void
}

class PreVerifiedCCCD {
  - id: integer
  - cccd_number: text
  - cccd_number_hash: text
  - full_name: text
  - date_of_birth: date
  - gender: text
  - address: text
  - issue_date: date
  - phone_number: text
  - status: text
  - notes: text
  - verified_at: timestamp
  - claimed_at: timestamp
  - created_at: timestamp

  + getPreVerifiedList(): void
  + updateStatus(): void
}

class OTPCode {
  - id: integer
  - cccd_number_hash: text
  - phone_number: text
  - code: text
  - expires_at: timestamp
  - verified: boolean
  - attempts: integer
  - created_at: timestamp

  + generateOTP(): void
  + verifyOTP(): void
}

class LoginLog {
  - id: integer
  - wallet_address: text
  - ip_address: text
  - user_agent: text
  - signature_valid: boolean
  - hash_match: boolean
  - login_success: boolean
  - is_anomaly: boolean
  - anomaly_score: float
  - anomaly_reason: text
  - message_signed: text
  - location: varchar(255)
  - country_code: varchar(2)
  - risk_score: float
  - timestamp: timestamp

  + logLogin(): void
  + getLoginHistory(): void
  + getAnomalousLogins(): void
}

class AnomalyRule {
  - id: integer
  - rule_name: text
  - rule_type: text
  - threshold: float
  - is_active: boolean
  - created_at: timestamp

  + getActiveRules(): void
}

class Service {
  - id: integer
  - name: text
  - description: text
  - category: text
  - requires_verification: boolean
  - metadata: jsonb
  - is_active: boolean
  - created_at: timestamp
  - updated_at: timestamp

  + getAllServices(): void
  + getServiceById(): void
}

class ServiceRequest {
  - id: integer
  - user_address: text
  - service_id: integer
  - status: text
  - request_data: jsonb
  - result_data: jsonb
  - approved_by: text
  - approved_at: timestamp
  - created_at: timestamp
  - updated_at: timestamp

  + createRequest(): void
  + getRequestsByUser(): void
  + updateStatus(): void
}

' Quan hệ giữa các lớp
PreVerifiedCCCD "1" -- "0..1" User : liên_kết >
PreVerifiedCCCD "1" -- "0..*" OTPCode : tạo_OTP >
User "1" -- "0..*" LoginLog : ghi_lại >
User "1" -- "0..*" ServiceRequest : gửi >
Service "1" -- "0..*" ServiceRequest : được_yêu_cầu >
AnomalyRule ..> LoginLog : áp_dụng >

@enduml





CSDL:

@startuml

entity "users" as users {
  * id : INTEGER <<PK>>
  --
  wallet_address : VARCHAR(255) <<UQ>>
  cccd_hash : TEXT
  cccd_number_hash : TEXT <<UQ>>
  encrypted_cccd_data : TEXT
  is_locked : BOOLEAN
  locked_reason : TEXT
  locked_at : TIMESTAMP
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

entity "pre_verified_cccd" as precccd {
  * id : INTEGER <<PK>>
  --
  cccd_number : TEXT
  cccd_number_hash : TEXT <<UQ>>
  full_name : TEXT
  date_of_birth : DATE
  gender : TEXT
  address : TEXT
  issue_date : DATE
  phone_number : TEXT
  status : TEXT
  notes : TEXT
  verified_at : TIMESTAMP
  claimed_at : TIMESTAMP
  created_at : TIMESTAMP
}

entity "otp_codes" as otp {
  * id : INTEGER <<PK>>
  --
  cccd_number_hash : TEXT
  phone_number : TEXT
  code : TEXT
  expires_at : TIMESTAMP
  verified : BOOLEAN
  attempts : INTEGER
  created_at : TIMESTAMP
}

entity "login_logs" as logs {
  * id : INTEGER <<PK>>
  --
  wallet_address : TEXT
  ip_address : TEXT
  user_agent : TEXT
  signature_valid : BOOLEAN
  hash_match : BOOLEAN
  login_success : BOOLEAN
  is_anomaly : BOOLEAN
  anomaly_score : FLOAT
  anomaly_reason : TEXT
  message_signed : TEXT
  location : VARCHAR(255)
  country_code : VARCHAR(2)
  risk_score : FLOAT
  timestamp : TIMESTAMP
}

entity "anomaly_rules" as rules {
  * id : INTEGER <<PK>>
  --
  rule_name : TEXT
  rule_type : TEXT
  threshold : FLOAT
  is_active : BOOLEAN
  created_at : TIMESTAMP
}

entity "services" as services {
  * id : INTEGER <<PK>>
  --
  name : TEXT
  description : TEXT
  category : TEXT
  requires_verification : BOOLEAN
  metadata : JSONB
  is_active : BOOLEAN
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

entity "service_requests" as requests {
  * id : INTEGER <<PK>>
  --
  user_address : TEXT
  service_id : INTEGER
  status : TEXT
  request_data : JSONB
  result_data : JSONB
  approved_by : TEXT
  approved_at : TIMESTAMP
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

' Quan hệ chính
precccd ||--o{ otp : "1:N\ncccd_number_hash"
precccd ||--o{ users : "1:1\ncccd_number_hash"
users ||--o{ logs : "1:N\nwallet_address"
users ||--o{ requests : "1:N\nuser_address"
services ||--o{ requests : "1:N\nservice_id"

@enduml
