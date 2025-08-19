# OrennaDAO dApp User Testing Guide

**Date:** August 17, 2025  
**Application Status:** ✅ Frontend Ready - Full User Testing Available  
**Local URL:** http://localhost:3000  
**API Status:** ⚠️ Backend in development (frontend functions independently)

---

## 🚀 **Quick Start**

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- MetaMask or other Web3 wallet extension installed
- Test ETH for transaction fees (if testing on testnets)

### Access the dApp
1. **Navigate to:** http://localhost:3000
2. **Expected:** Landing page loads with header navigation and wallet connect button
3. **First step:** Connect your Web3 wallet using the "Connect Wallet" button

---

## 🎯 **Core Features to Test**

### 1. **🔐 Wallet Connection & Authentication**
**Location:** Header → "Connect Wallet" button

**Test Flow:**
1. Click "Connect Wallet" 
2. Select your wallet provider (MetaMask, WalletConnect, etc.)
3. Approve connection in wallet popup
4. Verify wallet address appears in header
5. Test wallet switching/disconnection

**Expected Behavior:**
- Smooth wallet connection flow
- Wallet address displayed in header
- Persistent connection across page reloads
- Proper cleanup on disconnect

---

### 2. **🏛️ Governance System**
**Location:** Navigation → "Governance" or http://localhost:3000/governance

**Test Flow:**
1. **View Proposals**
   - Browse active governance proposals
   - Check proposal details (title, description, voting period)
   - Verify vote counts and progress bars

2. **Create Proposal** (if wallet connected)
   - Click "Create Proposal" button
   - Fill out proposal form with test data
   - Test different proposal types (Standard, Emergency, etc.)
   - Submit and verify validation

3. **Voting Interface**
   - Open any active proposal
   - Test voting options (For, Against, Abstain)
   - Add voting reason (optional)
   - Submit vote and check transaction flow

4. **Token Delegation**
   - Access delegation panel
   - Test delegating voting power to another address
   - Verify delegation status updates

**Expected Behavior:**
- Real-time proposal data loading
- Smooth voting UX with clear feedback
- Proper transaction confirmations
- Vote weight calculations display correctly

---

### 3. **📊 Analytics Dashboard**
**Location:** Navigation → "Analytics" or http://localhost:3000/analytics

**Test Flow:**
1. **Real-time Charts**
   - Verify charts load and display data
   - Test different time periods (24h, 7d, 30d)
   - Check chart responsiveness and interactivity

2. **Data Export**
   - Test CSV export functionality
   - Verify export includes proper data ranges
   - Check file downloads correctly

3. **Bulk Operations**
   - Test bulk export actions
   - Verify data filtering options
   - Check performance with large datasets

**Expected Behavior:**
- Charts render smoothly without errors
- Export functions work reliably
- Data updates in real-time
- Responsive design on different screen sizes

---

### 4. **💰 Payments & Finance**
**Location:** Navigation → "Payments" or http://localhost:3000/payments

**Test Flow:**
1. **Payment List**
   - Browse payment history
   - Filter by status, date, amount
   - Test pagination and sorting

2. **Create Payment**
   - Access payment creation form
   - Fill with test payment data
   - Test validation rules
   - Submit and track status

3. **Payment Details**
   - Click on individual payments
   - Verify all payment information displays
   - Check transaction links and status

**Expected Behavior:**
- Payment list loads efficiently
- Form validation works properly
- Payment status updates accurately
- Transaction details are complete

---

### 5. **🏗️ Project Management**
**Location:** Navigation → "Projects" or http://localhost:3000/projects

**Test Flow:**
1. **Project Dashboard**
   - View project list/grid
   - Test project filtering and search
   - Check project card information

2. **Project Creation**
   - Use project creation wizard
   - Test multi-step form flow
   - Upload project images/documents
   - Submit and verify project creation

3. **Project Details**
   - Open individual project pages
   - Navigate through project tabs
   - Test project update functionality

**Expected Behavior:**
- Smooth project creation workflow
- File uploads work correctly
- Project data persists properly
- Navigation between sections is fluid

---

### 6. **✅ Verification System**
**Location:** Navigation → "Verification" or http://localhost:3000/verification

**Test Flow:**
1. **VWBA Verification Wizard**
   - Start VWBA verification process
   - Complete multi-step wizard
   - Upload required evidence files
   - Submit for verification

2. **Evidence Upload**
   - Test drag-and-drop file upload
   - Verify file type restrictions
   - Check file size limits
   - Test upload progress indicators

3. **Verification Status**
   - Check verification status cards
   - Track verification progress
   - Review verification results

**Expected Behavior:**
- Wizard guides user through process clearly
- File uploads work reliably
- Status tracking is accurate
- Error handling is user-friendly

---

### 7. **🛍️ Marketplace**
**Location:** Navigation → "Marketplace" or http://localhost:3000/marketplace

**Test Flow:**
1. **Browse Items**
   - View marketplace listings
   - Test category filtering
   - Use search functionality

2. **Item Details**
   - Open individual item pages
   - Check item information completeness
   - Test image galleries

3. **Purchase Flow**
   - Initiate purchase process
   - Complete purchase forms
   - Test payment integration

**Expected Behavior:**
- Marketplace loads efficiently
- Search and filtering work smoothly
- Purchase flow is intuitive
- Item details are comprehensive

---

## 🧪 **Advanced Testing Scenarios**

### **Error Handling**
1. **Disconnect wallet mid-session** - Verify graceful handling
2. **Network switching** - Test different blockchain networks
3. **Transaction failures** - Check error messages and recovery
4. **Offline behavior** - Test app behavior without internet

### **Performance Testing**
1. **Large data sets** - Test with many proposals/projects/payments
2. **Slow network** - Throttle connection and test loading states
3. **Mobile devices** - Test responsive design on phones/tablets
4. **Multiple tabs** - Open app in multiple browser tabs

### **Security Testing**
1. **Wallet signatures** - Verify all signatures are legitimate
2. **Input validation** - Test with malicious/invalid inputs
3. **XSS protection** - Test script injection attempts
4. **CSRF protection** - Verify proper request handling

---

## 🐛 **Bug Reporting Template**

When you find issues, please report using this format:

```
**Bug Title:** [Brief description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:** 
[What actually happened]

**Browser/Environment:**
- Browser: [Chrome/Firefox/Safari/Edge + version]
- Wallet: [MetaMask/WalletConnect/etc.]
- Screen size: [Desktop/Tablet/Mobile]

**Screenshots/Videos:**
[Attach if helpful]

**Additional Notes:**
[Any other relevant information]
```

---

## ✅ **Testing Checklist**

### **Basic Functionality**
- [ ] App loads without errors
- [ ] Wallet connection works
- [ ] Navigation functions properly
- [ ] All main pages accessible

### **Governance**
- [ ] Proposal list loads
- [ ] Proposal creation works
- [ ] Voting interface functions
- [ ] Delegation works properly

### **Analytics**
- [ ] Charts display correctly
- [ ] Data export functions
- [ ] Real-time updates work

### **Payments**
- [ ] Payment list loads
- [ ] Payment creation works
- [ ] Payment details accessible

### **Projects**
- [ ] Project dashboard loads
- [ ] Project creation wizard works
- [ ] File uploads function

### **Verification**
- [ ] VWBA wizard completes
- [ ] Evidence upload works
- [ ] Status tracking accurate

### **Marketplace**
- [ ] Item browsing works
- [ ] Search/filter functions
- [ ] Purchase flow completes

### **Responsive Design**
- [ ] Desktop layout (1920x1080)
- [ ] Laptop layout (1366x768)
- [ ] Tablet layout (768x1024)
- [ ] Mobile layout (375x667)

### **Cross-Browser Compatibility**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## 🎯 **Focus Areas for Testing**

### **High Priority** 🔴
1. **Wallet Integration** - Core to Web3 functionality
2. **Governance Voting** - Primary dApp feature
3. **Verification Workflows** - Critical business logic
4. **Payment Processing** - Financial operations

### **Medium Priority** 🟡
1. **Analytics Dashboard** - Data visualization
2. **Project Management** - Project lifecycle
3. **Marketplace** - Economic features
4. **Responsive Design** - User experience

### **Low Priority** 🟢
1. **Advanced Filters** - Nice-to-have features
2. **Data Export** - Administrative functions
3. **Edge Cases** - Unusual user flows

---

## 📈 **Success Metrics**

### **Technical Metrics**
- **Page Load Time:** < 3 seconds
- **Transaction Success Rate:** > 95%
- **Error Rate:** < 5%
- **Mobile Responsiveness:** 100% features accessible

### **User Experience Metrics**
- **Wallet Connection:** < 10 seconds
- **Form Completion:** > 80% success rate
- **Navigation Clarity:** Users can find features without help
- **Error Recovery:** Clear error messages and recovery paths

---

## 🚨 **Known Limitations**

### **Backend API**
- ⚠️ API server currently has TypeScript compilation issues
- 🔄 Some features may use mock data
- 📡 Real-time updates may be limited
- 💾 Data persistence may be temporary

### **Blockchain Integration**
- 🧪 Currently configured for testnets
- ⛽ Requires test ETH for transactions
- 🔗 Limited to supported networks
- ⏱️ Transaction confirmations may be slow

### **File Storage**
- 📁 File uploads may use temporary storage
- 🔄 Large files may take time to process
- 🌐 IPFS integration in development

---

## 🎉 **What's Working Perfectly**

✅ **Frontend Build System** - Zero compilation errors  
✅ **Component Library** - All UI components functional  
✅ **Routing & Navigation** - Complete page structure  
✅ **Wallet Integration** - Full Web3 connectivity  
✅ **Form Validation** - Robust input handling  
✅ **Responsive Design** - Mobile-first approach  
✅ **State Management** - React hooks and providers  
✅ **Error Boundaries** - Graceful error handling  

---

## 🛠️ **Development Notes**

### **For Developers**
- Frontend uses Next.js 14 with TypeScript
- Styling with Tailwind CSS
- Web3 integration via Wagmi/Viem
- State management with React Context
- Component library uses Radix UI primitives

### **For QA Engineers**
- All critical user flows implemented
- Error states properly handled
- Loading states for async operations
- Accessibility features included
- Performance optimizations applied

---

**Happy Testing! 🚀**

*For questions or issues, check the console logs and network tab in browser dev tools for additional debugging information.*