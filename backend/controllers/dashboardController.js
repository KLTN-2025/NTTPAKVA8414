// controllers/dashboardController.js
const mongoose = require('mongoose');
const CustomerOrder = require('../models/CustomerOrders');
const CustomerOrderItem = require('../models/CustomerOrderItems');
const Product = require('../models/Products');

const TIMEZONE = 'Asia/Ho_Chi_Minh'; 
const TIMEZONE_OFFSET_MS = 7 * 60 * 60 * 1000; 

/**
 * Helper: Get current date/time in Vietnam timezone
 */
function getNowInVietnam() {
  const now = new Date();
  const vietnamTime = new Date(now.getTime() + TIMEZONE_OFFSET_MS);
  return vietnamTime;
}

/**
 * Convert Vietnam local date components to UTC Date
 */
function vietnamDateToUTC(year, month, day, hours = 0, minutes = 0, seconds = 0, ms = 0) {
  const vietnamDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds, ms));
  return new Date(vietnamDate.getTime() - TIMEZONE_OFFSET_MS);
}

/**
 * Get Vietnam date components from a Date object
 */
function getVietnamDateComponents(date) {
  const vietnamTime = new Date(date.getTime() + TIMEZONE_OFFSET_MS);
  return {
    year: vietnamTime.getUTCFullYear(),
    month: vietnamTime.getUTCMonth(),
    day: vietnamTime.getUTCDate(),
    dayOfWeek: vietnamTime.getUTCDay()
  };
}

/**
 * Helper: Get start and end dates for current and previous month
 */
function getMonthRanges() {
  // Get current time in Vietnam
  const nowVN = getVietnamDateComponents(new Date());
  
  const currentMonthStart = vietnamDateToUTC(nowVN.year, nowVN.month, 1, 0, 0, 0, 0);
  const currentMonthEnd = new Date();
  
  const prevMonth = nowVN.month === 0 ? 11 : nowVN.month - 1;
  const prevYear = nowVN.month === 0 ? nowVN.year - 1 : nowVN.year;
  
  const lastDayPrevMonth = new Date(nowVN.year, nowVN.month, 0).getDate();
  
  const prevMonthStart = vietnamDateToUTC(prevYear, prevMonth, 1, 0, 0, 0, 0);
  const prevMonthEnd = vietnamDateToUTC(prevYear, prevMonth, lastDayPrevMonth, 23, 59, 59, 999);
  
  return {
    current: { start: currentMonthStart, end: currentMonthEnd },
    previous: { start: prevMonthStart, end: prevMonthEnd }
  };
}

/**
 * Helper: Calculate percentage change, handling zero division
 * Returns 100 if previous is 0 and current > 0
 * Returns 0 if both are 0
 * Returns -100 if current is 0 and previous > 0
 */
function calculatePercentageChange(current, previous) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

/**
 * GET /api/admin/dashboard/summary
 * Returns summary cards data: Revenue, Orders, Pending Orders, Low Stock
 */
exports.getSummaryCards = async (req, res) => {
  try {
    const { current, previous } = getMonthRanges();
    const LOW_STOCK_THRESHOLD = 10;

    // Valid order statuses for revenue calculation
    const validStatuses = ['confirmed', 'shipped', 'delivered'];

    // ============ TOTAL REVENUE ============
    const [currentRevenue] = await CustomerOrder.aggregate([
      {
        $match: {
          order_date: { $gte: current.start, $lte: current.end },
          order_status: { $in: validStatuses }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total_amount' }
        }
      }
    ]);

    const [previousRevenue] = await CustomerOrder.aggregate([
      {
        $match: {
          order_date: { $gte: previous.start, $lte: previous.end },
          order_status: { $in: validStatuses }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total_amount' }
        }
      }
    ]);

    const revenueThisMonth = currentRevenue?.total || 0;
    const revenueLastMonth = previousRevenue?.total || 0;
    const revenueChange = calculatePercentageChange(revenueThisMonth, revenueLastMonth);

    // ============ TOTAL ORDERS ============
    const ordersThisMonth = await CustomerOrder.countDocuments({
      order_date: { $gte: current.start, $lte: current.end }
    });

    const ordersLastMonth = await CustomerOrder.countDocuments({
      order_date: { $gte: previous.start, $lte: previous.end }
    });

    const ordersChange = calculatePercentageChange(ordersThisMonth, ordersLastMonth);

    // ============ PENDING ORDERS ============
    const pendingOrders = await CustomerOrder.countDocuments({
      order_status: 'pending'
    });

    // For pending, compare to last month's pending at same point in time
    // (This is a snapshot, so we just show current count without comparison)

    // ============ LOW STOCK ITEMS ============
    const lowStockCount = await Product.countDocuments({
      current_stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD },
      is_deleted: { $ne: true }
    });

    const outOfStockCount = await Product.countDocuments({
      current_stock: 0,
      is_deleted: { $ne: true }
    });

    return res.status(200).json({
      success: true,
      data: {
        revenue: {
          value: revenueThisMonth,
          change: revenueChange,
          period: 'vs last month'
        },
        orders: {
          value: ordersThisMonth,
          change: ordersChange,
          period: 'vs last month'
        },
        pendingOrders: {
          value: pendingOrders,
          label: 'Needs attention'
        },
        lowStock: {
          value: lowStockCount,
          outOfStock: outOfStockCount,
          threshold: LOW_STOCK_THRESHOLD,
          label: 'Items to restock'
        }
      },
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dashboard summary',
      error: error.message
    });
  }
};

/**
 * GET /api/admin/dashboard/chart
 * Returns sales data for chart visualization
 * Query params: period (7days | 4weeks | 12months)
 */
exports.getSalesChart = async (req, res) => {
  try {
    const period = req.query.period || '7days';
    const nowVN = getVietnamDateComponents(new Date());
    
    let startDate, groupBy, labels = [];
    const validStatuses = ['confirmed', 'shipped', 'delivered'];

    switch (period) {
      case '7days':
        // Start from 6 days ago at midnight Vietnam time
        const startDayVN = new Date(Date.UTC(nowVN.year, nowVN.month, nowVN.day - 6));
        startDate = vietnamDateToUTC(
          startDayVN.getUTCFullYear(),
          startDayVN.getUTCMonth(),
          startDayVN.getUTCDate(),
          0, 0, 0, 0
        );
        
        // Group by year/month/day in Vietnam timezone
        groupBy = {
          year: { $year: { date: '$order_date', timezone: TIMEZONE } },
          month: { $month: { date: '$order_date', timezone: TIMEZONE } },
          day: { $dayOfMonth: { date: '$order_date', timezone: TIMEZONE } }
        };
        
        // Generate labels for last 7 days (Vietnam time)
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.UTC(nowVN.year, nowVN.month, nowVN.day - i));
          const labelDate = new Date(d.getTime()); // For display formatting
          labels.push({
            key: `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`,
            label: labelDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric',
              timeZone: TIMEZONE 
            })
          });
        }
        break;

      case '4weeks':
        // Start from 27 days ago at midnight Vietnam time
        const startWeekVN = new Date(Date.UTC(nowVN.year, nowVN.month, nowVN.day - 27));
        startDate = vietnamDateToUTC(
          startWeekVN.getUTCFullYear(),
          startWeekVN.getUTCMonth(),
          startWeekVN.getUTCDate(),
          0, 0, 0, 0
        );
        
        // Group by year/week in Vietnam timezone
        groupBy = {
          year: { $year: { date: '$order_date', timezone: TIMEZONE } },
          week: { $isoWeek: { date: '$order_date', timezone: TIMEZONE } }
        };
        
        // Generate labels for last 4 weeks
        for (let i = 3; i >= 0; i--) {
          const weekDate = new Date(Date.UTC(nowVN.year, nowVN.month, nowVN.day - (i * 7)));
          const weekNum = getISOWeekVietnam(weekDate);
          labels.push({
            key: `${weekDate.getUTCFullYear()}-W${weekNum}`,
            label: `Week ${4 - i}`
          });
        }
        break;

      case '12months':
        // Start from 11 months ago, 1st day at midnight Vietnam time
        const startMonthVN = new Date(Date.UTC(nowVN.year, nowVN.month - 11, 1));
        startDate = vietnamDateToUTC(
          startMonthVN.getUTCFullYear(),
          startMonthVN.getUTCMonth(),
          1,
          0, 0, 0, 0
        );
        
        // Group by year/month in Vietnam timezone
        groupBy = {
          year: { $year: { date: '$order_date', timezone: TIMEZONE } },
          month: { $month: { date: '$order_date', timezone: TIMEZONE } }
        };
        
        // Generate labels for last 12 months
        for (let i = 11; i >= 0; i--) {
          const d = new Date(Date.UTC(nowVN.year, nowVN.month - i, 1));
          labels.push({
            key: `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`,
            label: new Date(d).toLocaleDateString('en-US', { 
              month: 'short', 
              year: '2-digit',
              timeZone: TIMEZONE 
            })
          });
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid period. Use: 7days, 4weeks, or 12months'
        });
    }

    // Aggregate revenue data (groupBy now includes timezone)
    const revenueData = await CustomerOrder.aggregate([
      {
        $match: {
          order_date: { $gte: startDate },
          order_status: { $in: validStatuses }
        }
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$total_amount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } }
    ]);

    // Map aggregated data to labels
    const chartData = labels.map(labelInfo => {
      let matchingData;
      
      if (period === '7days') {
        const [year, month, day] = labelInfo.key.split('-').map(Number);
        matchingData = revenueData.find(d => 
          d._id.year === year && d._id.month === month && d._id.day === day
        );
      } else if (period === '4weeks') {
        const [year, week] = labelInfo.key.replace('W', '-').split('-').map(Number);
        matchingData = revenueData.find(d => 
          d._id.year === year && d._id.week === week
        );
      } else {
        const [year, month] = labelInfo.key.split('-').map(Number);
        matchingData = revenueData.find(d => 
          d._id.year === year && d._id.month === month
        );
      }

      return {
        label: labelInfo.label,
        revenue: matchingData?.revenue || 0,
        orders: matchingData?.orderCount || 0
      };
    });

    // Calculate totals
    const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);

    return res.status(200).json({
      success: true,
      data: {
        period,
        labels: chartData.map(d => d.label),
        datasets: {
          revenue: chartData.map(d => d.revenue),
          orders: chartData.map(d => d.orders)
        },
        totals: {
          revenue: totalRevenue,
          orders: totalOrders
        }
      },
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Dashboard chart error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching chart data',
      error: error.message
    });
  }
};

/**
 * GET /api/admin/dashboard/best-sellers
 * Returns top 5 best-selling products this month by quantity
 */
exports.getBestSellers = async (req, res) => {
  try {
    const { current } = getMonthRanges();
    const limit = parseInt(req.query.limit) || 5;
    const validStatuses = ['confirmed', 'shipped', 'delivered'];

    // Get order IDs for valid orders this month
    const validOrders = await CustomerOrder.find({
      order_date: { $gte: current.start, $lte: current.end },
      order_status: { $in: validStatuses }
    }).select('_id').lean();

    const validOrderIds = validOrders.map(o => o._id);

    if (validOrderIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        period: 'This month',
        generatedAt: new Date()
      });
    }

    // Aggregate best sellers
    const bestSellers = await CustomerOrderItem.aggregate([
      {
        $match: {
          order_id: { $in: validOrderIds }
        }
      },
      {
        $group: {
          _id: '$product_id',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1,
          name: '$product.name',
          sku: '$product.SKU',
          price: '$product.selling_price',
          image: { $arrayElemAt: ['$product.image_urls', 0] },
          currentStock: '$product.current_stock'
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      data: bestSellers,
      period: 'This month',
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Dashboard best sellers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching best sellers',
      error: error.message
    });
  }
};

/**
 * GET /api/admin/dashboard/all
 * Returns all dashboard data in a single request (for initial load)
 */
exports.getAllDashboardData = async (req, res) => {
  try {
    const period = req.query.chartPeriod || '7days';
    const { current, previous } = getMonthRanges();
    const LOW_STOCK_THRESHOLD = 10;
    const validStatuses = ['confirmed', 'shipped', 'delivered'];

    const [
      currentRevenueResult,
      previousRevenueResult,
      ordersThisMonth,
      ordersLastMonth,
      pendingOrders,
      lowStockCount,
      outOfStockCount,
      validOrders
    ] = await Promise.all([
      CustomerOrder.aggregate([
        {
          $match: {
            order_date: { $gte: current.start, $lte: current.end },
            order_status: { $in: validStatuses }
          }
        },
        { $group: { _id: null, total: { $sum: '$total_amount' } } }
      ]),
      // Previous month revenue
      CustomerOrder.aggregate([
        {
          $match: {
            order_date: { $gte: previous.start, $lte: previous.end },
            order_status: { $in: validStatuses }
          }
        },
        { $group: { _id: null, total: { $sum: '$total_amount' } } }
      ]),
      // Orders this month
      CustomerOrder.countDocuments({
        order_date: { $gte: current.start, $lte: current.end }
      }),
      // Orders last month
      CustomerOrder.countDocuments({
        order_date: { $gte: previous.start, $lte: previous.end }
      }),
      // Pending orders
      CustomerOrder.countDocuments({ order_status: 'pending' }),
      // Low stock
      Product.countDocuments({
        current_stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD },
        is_deleted: { $ne: true }
      }),
      // Out of stock
      Product.countDocuments({
        current_stock: 0,
        is_deleted: { $ne: true }
      }),
      // Valid orders this month (for best sellers)
      CustomerOrder.find({
        order_date: { $gte: current.start, $lte: current.end },
        order_status: { $in: validStatuses }
      }).select('_id').lean()
    ]);

    // Calculate summary values
    const revenueThisMonth = currentRevenueResult[0]?.total || 0;
    const revenueLastMonth = previousRevenueResult[0]?.total || 0;
    const revenueChange = calculatePercentageChange(revenueThisMonth, revenueLastMonth);
    const ordersChange = calculatePercentageChange(ordersThisMonth, ordersLastMonth);


    // Chart data
    const nowVN = getVietnamDateComponents(new Date());
    let startDate, groupBy, labels = [];

    switch (period) {
      case '7days':
        const startDayVN = new Date(Date.UTC(nowVN.year, nowVN.month, nowVN.day - 6));
        startDate = vietnamDateToUTC(
          startDayVN.getUTCFullYear(),
          startDayVN.getUTCMonth(),
          startDayVN.getUTCDate(),
          0, 0, 0, 0
        );
        groupBy = {
          year: { $year: { date: '$order_date', timezone: TIMEZONE } },
          month: { $month: { date: '$order_date', timezone: TIMEZONE } },
          day: { $dayOfMonth: { date: '$order_date', timezone: TIMEZONE } }
        };
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.UTC(nowVN.year, nowVN.month, nowVN.day - i));
          labels.push({
            key: `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`,
            label: new Date(d).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric',
              timeZone: TIMEZONE 
            })
          });
        }
        break;
        
      case '4weeks':
        const startWeekVN = new Date(Date.UTC(nowVN.year, nowVN.month, nowVN.day - 27));
        startDate = vietnamDateToUTC(
          startWeekVN.getUTCFullYear(),
          startWeekVN.getUTCMonth(),
          startWeekVN.getUTCDate(),
          0, 0, 0, 0
        );
        groupBy = {
          year: { $year: { date: '$order_date', timezone: TIMEZONE } },
          week: { $isoWeek: { date: '$order_date', timezone: TIMEZONE } }
        };
        for (let i = 3; i >= 0; i--) {
          const weekDate = new Date(Date.UTC(nowVN.year, nowVN.month, nowVN.day - (i * 7)));
          const weekNum = getISOWeekVietnam(weekDate);
          labels.push({
            key: `${weekDate.getUTCFullYear()}-W${weekNum}`,
            label: `Week ${4 - i}`
          });
        }
        break;
        
      case '12months':
        const startMonthVN = new Date(Date.UTC(nowVN.year, nowVN.month - 11, 1));
        startDate = vietnamDateToUTC(
          startMonthVN.getUTCFullYear(),
          startMonthVN.getUTCMonth(),
          1,
          0, 0, 0, 0
        );
        groupBy = {
          year: { $year: { date: '$order_date', timezone: TIMEZONE } },
          month: { $month: { date: '$order_date', timezone: TIMEZONE } }
        };
        for (let i = 11; i >= 0; i--) {
          const d = new Date(Date.UTC(nowVN.year, nowVN.month - i, 1));
          labels.push({
            key: `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`,
            label: new Date(d).toLocaleDateString('en-US', { 
              month: 'short', 
              year: '2-digit',
              timeZone: TIMEZONE 
            })
          });
        }
        break;
    }

     const revenueData = await CustomerOrder.aggregate([
      {
        $match: {
          order_date: { $gte: startDate },
          order_status: { $in: validStatuses }
        }
      },
      {
        $group: {
          _id: groupBy, 
          revenue: { $sum: '$total_amount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } }
    ]);

    const chartData = labels.map(labelInfo => {
      let matchingData;
      if (period === '7days') {
        const [year, month, day] = labelInfo.key.split('-').map(Number);
        matchingData = revenueData.find(d => 
          d._id.year === year && d._id.month === month && d._id.day === day
        );
      } else if (period === '4weeks') {
        const [year, week] = labelInfo.key.replace('W', '-').split('-').map(Number);
        matchingData = revenueData.find(d => 
          d._id.year === year && d._id.week === week
        );
      } else {
        const [year, month] = labelInfo.key.split('-').map(Number);
        matchingData = revenueData.find(d => 
          d._id.year === year && d._id.month === month
        );
      }
      return {
        label: labelInfo.label,
        revenue: matchingData?.revenue || 0,
        orders: matchingData?.orderCount || 0
      };
    });

    // Best sellers
    const validOrderIds = validOrders.map(o => o._id);
    let bestSellers = [];

    if (validOrderIds.length > 0) {
      bestSellers = await CustomerOrderItem.aggregate([
        { $match: { order_id: { $in: validOrderIds } } },
        {
          $group: {
            _id: '$product_id',
            totalQuantity: { $sum: '$quantity' },
            totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $project: {
            _id: 1,
            totalQuantity: 1,
            totalRevenue: 1,
            name: '$product.name',
            sku: '$product.SKU',
            price: '$product.selling_price',
            image: { $arrayElemAt: ['$product.image_urls', 0] },
            currentStock: '$product.current_stock'
          }
        }
      ]);
    }

    return res.status(200).json({
      success: true,
      summary: {
        revenue: {
          value: revenueThisMonth,
          change: revenueChange,
          period: 'vs last month'
        },
        orders: {
          value: ordersThisMonth,
          change: ordersChange,
          period: 'vs last month'
        },
        pendingOrders: {
          value: pendingOrders,
          label: 'Needs attention'
        },
        lowStock: {
          value: lowStockCount,
          outOfStock: outOfStockCount,
          threshold: LOW_STOCK_THRESHOLD,
          label: 'Items to restock'
        }
      },
      chart: {
        period,
        labels: chartData.map(d => d.label),
        datasets: {
          revenue: chartData.map(d => d.revenue),
          orders: chartData.map(d => d.orders)
        }
      },
      bestSellers,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Dashboard all data error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

/**
 * Helper: Get ISO week number for a date
 */
function getISOWeekVietnam(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const getISOWeek = getISOWeekVietnam;