const { VNPay } = require('vnpay');
require('dotenv').config()

const vnpayResponseCodes = {
  '00': 'Transaction successful',
  '07': 'Suspicious transaction (money deducted)',
  '09': 'Card/Account not registered for InternetBanking',
  '10': 'Incorrect authentication more than 3 times',
  '11': 'Payment deadline has passed',
  '12': 'Card/Account is locked',
  '13': 'Wrong OTP',
  '24': 'Customer cancelled transaction',
  '51': 'Insufficient balance',
  '65': 'Exceeded daily transaction limit',
  '75': 'Bank is under maintenance',
  '79': 'Wrong payment password too many times',
  '99': 'Other errors'
};

function getResponseMessage(responseCode) {
  return vnpayResponseCodes[responseCode] || `Unknown error (${responseCode})`;
}

function create_VNpay() {
        const vnpay = new VNPay({
        tmnCode: process.env.VNPAY_TMN_CODE,
        secureSecret: process.env.VNPAY_HASH_SECRET,
        vnpayHost: 'https://sandbox.vnpayment.vn',
        testMode: true, 
        hashAlgorithm: 'SHA512', 
        enableLog: false,
        endpoints: {
            paymentEndpoint: 'paymentv2/vpcpay.html',
            queryDrRefundEndpoint: 'merchant_webapi/api/transaction',
            getBankListEndpoint: 'qrpayauth/api/merchant/get_bank_list',
        },
    });
    return vnpay;
}

module.exports = {
    getResponseMessage,
    create_VNpay
};