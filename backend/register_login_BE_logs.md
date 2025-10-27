 DEBUG: useExistingWallet = true
RegisterMetaMask.tsx:92 ✅ User chose to use existing wallet - connecting MetaMask...
RegisterMetaMask.tsx:129 🔍 DEBUG: Before adding wallet fields, useExistingWallet = true
RegisterMetaMask.tsx:130 🔍 DEBUG: walletAddress = 0x70997970c51812dc3a010c7d01b50e0d17dc79c8
RegisterMetaMask.tsx:131 🔍 DEBUG: signature = EXISTS
RegisterMetaMask.tsx:135 ✅ Adding walletAddress and signature to request
RegisterMetaMask.tsx:142 📤 Sending request data: {cccdNumber: '036202012348', fullName: 'Nguyễn Thị D', dateOfBirth: '1993-07-21', gender: 'Nữ', address: 'Số 456 Đường Trần Hưng Đạo, Quận 5, TP.HCM', …}address: "Số 456 Đường Trần Hưng Đạo, Quận 5, TP.HCM"cccdNumber: "036202012348"dateOfBirth: "1993-07-21"fullName: "Nguyễn Thị D"gender: "Nữ"issueDate: "2021-06-14"phoneNumber: "0901234570"signature: "EXISTS"verificationToken: "eyJjY2NkTnVtYmVySGFzaCI6IjB4NTFhNzE0MTdjOTJkMDE3YTAwYWFmNzJiNTQwZjhlOWI0NjM2MjNjYmMzYjRmMmZlZTIwMTA4YmM5OWJjZGEyZCIsInZlcmlmaWVkQXQiOjE3NjE2MDI1NjkwNTZ9"walletAddress: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"[[Prototype]]: Object
api.ts:42 🔍 API: registerWithMetaMask called with data: {cccdNumber: '036202012348', fullName: 'Nguyễn Thị D', dateOfBirth: '1993-07-21', gender: 'Nữ', address: 'Số 456 Đường Trần Hưng Đạo, Quận 5, TP.HCM', …}address: "Số 456 Đường Trần Hưng Đạo, Quận 5, TP.HCM"cccdNumber: "036202012348"dateOfBirth: "1993-07-21"fullName: "Nguyễn Thị D"gender: "Nữ"hasWalletAddress: trueissueDate: "2021-06-14"phoneNumber: "0901234570"signature: "EXISTS (length: 132)"verificationToken: "eyJjY2NkTnVtYmVySGFzaCI6IjB4NTFhNzE0MTdjOTJkMDE3YTAwYWFmNzJiNTQwZjhlOWI0NjM2MjNjYmMzYjRmMmZlZTIwMTA4YmM5OWJjZGEyZCIsInZlcmlmaWVkQXQiOjE3NjE2MDI1NjkwNTZ9"walletAddress: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"[[Prototype]]: Object
api.ts:20 🔍 AXIOS INTERCEPTOR: Request config.data = {cccdNumber: '036202012348', fullName: 'Nguyễn Thị D', dateOfBirth: '1993-07-21', gender: 'Nữ', address: 'Số 456 Đường Trần Hưng Đạo, Quận 5, TP.HCM', …}address: "Số 456 Đường Trần Hưng Đạo, Quận 5, TP.HCM"cccdNumber: "036202012348"dateOfBirth: "1993-07-21"fullName: "Nguyễn Thị D"gender: "Nữ"issueDate: "2021-06-14"phoneNumber: "0901234570"signature: "0x8b88824e63aa99fa8ed55983fe368b4348e396cb3e4295345deb54f0065538a71b7519eee3cad57248f2e02f5dd33c17b9818ba13aa6d09e4c5f17ff94b80b181b"verificationToken: "eyJjY2NkTnVtYmVySGFzaCI6IjB4NTFhNzE0MTdjOTJkMDE3YTAwYWFmNzJiNTQwZjhlOWI0NjM2MjNjYmMzYjRmMmZlZTIwMTA4YmM5OWJjZGEyZCIsInZlcmlmaWVkQXQiOjE3NjE2MDI1NjkwNTZ9"walletAddress: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"[[Prototype]]: Object
api.ts:21 🔍 AXIOS INTERCEPTOR: Has walletAddress? true
api.ts:22 🔍 AXIOS INTERCEPTOR: Has signature? true
api.ts:49  POST http://localhost:3000/api/auth/register 500 (Internal Server Error)
dispatchXhrRequest @ axios.js?v=6a249767:1683
xhr @ axios.js?v=6a249767:1560
dispatchRequest @ axios.js?v=6a249767:2085
Promise.then
_request @ axios.js?v=6a249767:2288
request @ axios.js?v=6a249767:2197
httpMethod @ axios.js?v=6a249767:2334
wrap @ axios.js?v=6a249767:8
registerWithMetaMask @ api.ts:49
handleRegister @ RegisterMetaMask.tsx:144
await in handleRegister
executeDispatch @ react-dom_client.js?v=6a249767:13622
runWithFiberInDEV @ react-dom_client.js?v=6a249767:997
processDispatchQueue @ react-dom_client.js?v=6a249767:13658
(anonymous) @ react-dom_client.js?v=6a249767:14071
batchedUpdates$1 @ react-dom_client.js?v=6a249767:2626
dispatchEventForPluginEventSystem @ react-dom_client.js?v=6a249767:13763
dispatchEvent @ react-dom_client.js?v=6a249767:16784
dispatchDiscreteEvent @ react-dom_client.js?v=6a249767:16765
<button>
exports.createElement @ chunk-KMU3Z7QX.js?v=6a249767:793
(anonymous) @ chunk-S5ICA3HE.js?v=6a249767:3438
MuiButtonBase-root @ chunk-S5ICA3HE.js?v=6a249767:2549
react_stack_bottom_frame @ react-dom_client.js?v=6a249767:18509
renderWithHooks @ react-dom_client.js?v=6a249767:5654
updateForwardRef @ react-dom_client.js?v=6a249767:7198
beginWork @ react-dom_client.js?v=6a249767:8735
runWithFiberInDEV @ react-dom_client.js?v=6a249767:997
performUnitOfWork @ react-dom_client.js?v=6a249767:12561
workLoopSync @ react-dom_client.js?v=6a249767:12424
renderRootSync @ react-dom_client.js?v=6a249767:12408
performWorkOnRoot @ react-dom_client.js?v=6a249767:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=6a249767:13505
performWorkUntilDeadline @ react-dom_client.js?v=6a249767:36
<MuiButtonBaseRoot>
exports.jsxs @ chunk-FXVZLN7E.js?v=6a249767:258
ButtonBase2 @ @mui_material.js?v=6a249767:3750
react_stack_bottom_frame @ react-dom_client.js?v=6a249767:18509
renderWithHooks @ react-dom_client.js?v=6a249767:5654
updateForwardRef @ react-dom_client.js?v=6a249767:7198
beginWork @ react-dom_client.js?v=6a249767:8735
runWithFiberInDEV @ react-dom_client.js?v=6a249767:997
performUnitOfWork @ react-dom_client.js?v=6a249767:12561
workLoopSync @ react-dom_client.js?v=6a249767:12424
renderRootSync @ react-dom_client.js?v=6a249767:12408
performWorkOnRoot @ react-dom_client.js?v=6a249767:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=6a249767:13505
performWorkUntilDeadline @ react-dom_client.js?v=6a249767:36
<ForwardRef(ButtonBase2)>
exports.createElement @ chunk-KMU3Z7QX.js?v=6a249767:793
(anonymous) @ chunk-S5ICA3HE.js?v=6a249767:3438
MuiButton-root @ chunk-S5ICA3HE.js?v=6a249767:2549
react_stack_bottom_frame @ react-dom_client.js?v=6a249767:18509
renderWithHooks @ react-dom_client.js?v=6a249767:5654
updateForwardRef @ react-dom_client.js?v=6a249767:7198
beginWork @ react-dom_client.js?v=6a249767:8735
runWithFiberInDEV @ react-dom_client.js?v=6a249767:997
performUnitOfWork @ react-dom_client.js?v=6a249767:12561
workLoopSync @ react-dom_client.js?v=6a249767:12424
renderRootSync @ react-dom_client.js?v=6a249767:12408
performWorkOnRoot @ react-dom_client.js?v=6a249767:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=6a249767:13505
performWorkUntilDeadline @ react-dom_client.js?v=6a249767:36
<MuiButtonRoot>
exports.jsxs @ chunk-FXVZLN7E.js?v=6a249767:258
Button2 @ @mui_material.js?v=6a249767:14655
react_stack_bottom_frame @ react-dom_client.js?v=6a249767:18509
renderWithHooks @ react-dom_client.js?v=6a249767:5654
updateForwardRef @ react-dom_client.js?v=6a249767:7198
beginWork @ react-dom_client.js?v=6a249767:8735
runWithFiberInDEV @ react-dom_client.js?v=6a249767:997
performUnitOfWork @ react-dom_client.js?v=6a249767:12561
workLoopSync @ react-dom_client.js?v=6a249767:12424
renderRootSync @ react-dom_client.js?v=6a249767:12408
performWorkOnRoot @ react-dom_client.js?v=6a249767:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=6a249767:13505
performWorkUntilDeadline @ react-dom_client.js?v=6a249767:36
<ForwardRef(Button2)>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=6a249767:247
RegisterMetaMask @ RegisterMetaMask.tsx:367
react_stack_bottom_frame @ react-dom_client.js?v=6a249767:18509
renderWithHooks @ react-dom_client.js?v=6a249767:5654
updateFunctionComponent @ react-dom_client.js?v=6a249767:7475
beginWork @ react-dom_client.js?v=6a249767:8525
runWithFiberInDEV @ react-dom_client.js?v=6a249767:997
performUnitOfWork @ react-dom_client.js?v=6a249767:12561
workLoopSync @ react-dom_client.js?v=6a249767:12424
renderRootSync @ react-dom_client.js?v=6a249767:12408
performWorkOnRoot @ react-dom_client.js?v=6a249767:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=6a249767:13505
performWorkUntilDeadline @ react-dom_client.js?v=6a249767:36
<RegisterMetaMask>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=6a249767:247
App @ App.tsx:46
react_stack_bottom_frame @ react-dom_client.js?v=6a249767:18509
renderWithHooks @ react-dom_client.js?v=6a249767:5654
updateFunctionComponent @ react-dom_client.js?v=6a249767:7475
beginWork @ react-dom_client.js?v=6a249767:8525
runWithFiberInDEV @ react-dom_client.js?v=6a249767:997
performUnitOfWork @ react-dom_client.js?v=6a249767:12561
workLoopSync @ react-dom_client.js?v=6a249767:12424
renderRootSync @ react-dom_client.js?v=6a249767:12408
performWorkOnRoot @ react-dom_client.js?v=6a249767:11766
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=6a249767:13505
performWorkUntilDeadline @ react-dom_client.js?v=6a249767:36Understand this error
RegisterMetaMask.tsx:164 ❌ Registration error: {error: 'ethers is not defined'}

2. logs BE
========================================
📱 SMS MOCK (Demo Mode)
To: 0901234570
Message: Mã OTP của bạn là: 663751
Có hiệu lực trong 5 phút.
========================================

2025-10-28 05:02:49 [info]: POST /api/verify/confirm-otp - Origin: http://localhost:5173 {"service":"did-backend"}
2025-10-28 05:02:49 [info]: Confirm OTP API called {"service":"did-backend","cccdNumber":"0362****","ip":"127.0.0.1"}
2025-10-28 05:02:49 [info]: OTP verification attempt {"service":"did-backend","cccdNumberHash":"0x51a71417..."}
2025-10-28 05:02:49 [info]: OTP verified successfully {"service":"did-backend","cccdNumberHash":"0x51a71417c92d017a00aaf72b540f8e9b463623cbc3b4f2fee20108bc99bcda2d"}
2025-10-28 05:02:49 [info]: Pre-verification status updated to verified {"service":"did-backend","cccdNumberHash":"0x51a71417..."}
2025-10-28 05:02:49 [info]: Verification token generated {"service":"did-backend","cccdNumberHash":"0x51a71417..."}
2025-10-28 05:02:49 [info]: Citizen data from DB {"service":"did-backend","found":true,"fullName":"Nguyễn Thị D","hasData":6}
2025-10-28 05:02:49 [info]: Formatted citizen info {"service":"did-backend","citizenInfo":{"fullName":"Nguyễn Thị D","dateOfBirth":"1993-07-21","gender":"Nữ","address":"Số 456 Đường Trần Hưng Đạo, Quận 5, TP.HCM","issueDate":"2021-06-14","phoneNumber":"0901234570"}}
2025-10-28 05:02:49 [info]: Citizen info retrieved {"service":"did-backend","hasInfo":true,"fullName":"Nguyễn Thị D"}
2025-10-28 05:03:19 [info]: POST /api/auth/register - Origin: http://localhost:5173 {"service":"did-backend"}
2025-10-28 05:03:19 [info]: 🔍 MIDDLEWARE: Checking req.body after body-parser {"service":"did-backend","hasBody":true,"bodyKeys":["cccdNumber","fullName","dateOfBirth","gender","address","issueDate","phoneNumber","verificationToken","walletAddress","signature"],"hasWalletAddress":true,"hasSignature":true,"walletAddress":"0x70997970c51812dc3a010c7d01b50e0d17dc79c8","signatureLength":132}
2025-10-28 05:03:19 [info]: 🔍 DEBUG: Raw req.body {"service":"did-backend","keys":["cccdNumber","fullName","dateOfBirth","gender","address","issueDate","phoneNumber","verificationToken","walletAddress","signature"],"walletAddress":"0x70997970c51812dc3a010c7d01b50e0d17dc79c8","signature":"EXISTS"}
2025-10-28 05:03:19 [info]: Registration attempt started (MetaMask flow) {"service":"did-backend","cccdNumber":"0362***","phoneNumber":"0901***","withPreVerification":true,"useExistingWallet":true,"hasWalletAddress":true,"hasSignature":true}
2025-10-28 05:03:19 [info]: Using existing wallet {"service":"did-backend","address":"0x70997970c51812dc3a010c7d01b50e0d17dc79c8"}
2025-10-28 05:03:19 [error]: Registration failed {"service":"did-backend","error":"ethers is not defined","stack":"ReferenceError: ethers is not defined\n    at register (D:\\hoc\\DOAN\\Blockchain\\project_blockchain\\backend\\src\\controllers\\auth\\register.controller.js:56:34)\n    at Layer.handleRequest (D:\\hoc\\DOAN\\Blockchain\\project_blockchain\\backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (D:\\hoc\\DOAN\\Blockchain\\project_blockchain\\backend\\node_modules\\router\\lib\\route.js:157:13)\n    at D:\\hoc\\DOAN\\Blockchain\\project_blockchain\\backend\\src\\middleware\\validation-schemas.js:93:7\n    at Layer.handleRequest (D:\\hoc\\DOAN\\Blockchain\\project_blockchain\\backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (D:\\hoc\\DOAN\\Blockchain\\project_blockchain\\backend\\node_modules\\router\\lib\\route.js:157:13)\n    at D:\\hoc\\DOAN\\Blockchain\\project_blockchain\\backend\\node_modules\\express-rate-limit\\dist\\index.cjs:899:7\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async D:\\hoc\\DOAN\\Blockchain\\project_blockchain\\backend\\node_modules\\express-rate-limit\\dist\\index.cjs:782:5"}