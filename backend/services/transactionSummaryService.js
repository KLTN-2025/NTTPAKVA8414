// services/transactionSummaryService.js

const Transaction = require('../models/Transactions');


const cache = {
  summaries: null,
  summariesExpiry: 0,
  summariesLastUpdated: null,  
  charts: new Map() // Map<period, { data, expiry, lastUpdated }>
};

const SUMMARY_CACHE_TTL = 15 * 60 * 1000;  // 15 minutes
const CHART_CACHE_TTL = 15 * 60 * 1000;    // 15 minutes

/**
 * Invalidate all caches
 */
function invalidateCache() {
  cache.summaries = null;
  cache.summariesExpiry = 0;
  cache.summariesLastUpdated = null;
  cache.charts.clear();
}

/**
 * Force refresh - invalidate cache and recalculate all data
 */
async function forceRefresh(chartPeriod = 'today') {
  invalidateCache();
  const result = await getSummaryWithChart(chartPeriod);
  return {
    ...result,
    lastUpdated: cache.summariesLastUpdated
  };
}

/**
 * Get the last updated timestamp
 */
function getLastUpdated() {
  return cache.summariesLastUpdated;
}

/**
 * Check if summary cache is valid
 */
function isSummaryCacheValid() {
  return cache.summaries !== null && Date.now() < cache.summariesExpiry;
}

/**
 * Check if chart cache is valid for a period
 */
function isChartCacheValid(period) {
  const cached = cache.charts.get(period);
  return cached && Date.now() < cached.expiry;
}

/**
 * Get date ranges for all periods, calculated in Vietnam timezone.
 */
function getDateRanges() {
  const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
  
  const now = new Date();
  
  const nowVietnam = new Date(now.getTime() + VIETNAM_OFFSET_MS);
  
  const vnYear = nowVietnam.getUTCFullYear();
  const vnMonth = nowVietnam.getUTCMonth();
  const vnDate = nowVietnam.getUTCDate();
  const vnDayOfWeek = nowVietnam.getUTCDay();
  
  function vietnamToUTC(year, month, day, hours = 0, mins = 0, secs = 0) {
    const vietnamTime = Date.UTC(year, month, day, hours, mins, secs);
    return new Date(vietnamTime - VIETNAM_OFFSET_MS);
  }
  
  const todayStart = vietnamToUTC(vnYear, vnMonth, vnDate);
  
  const diffToMonday = vnDayOfWeek === 0 ? 6 : vnDayOfWeek - 1;
  const weekStart = vietnamToUTC(vnYear, vnMonth, vnDate - diffToMonday);
  
  const monthStart = vietnamToUTC(vnYear, vnMonth, 1);
  
  const yearStart = vietnamToUTC(vnYear, 0, 1);
  
  return {
    now,
    today: { start: todayStart, end: now },
    week: { start: weekStart, end: now },
    month: { start: monthStart, end: now },
    year: { start: yearStart, end: now }
  };
}

async function calculateAllSummaries() {
  if (isSummaryCacheValid()) {
    return cache.summaries;
  }
  
  const ranges = getDateRanges();
  
  const [result] = await Transaction.aggregate([
    {
      $facet: {
        today: [
          { 
            $match: { 
              is_deleted: { $ne: true },
              date: { $gte: ranges.today.start, $lte: ranges.today.end } 
            } 
          },
          { 
            $group: { 
              _id: '$type', 
              total: { $sum: '$amount' } 
            } 
          }
        ],
        week: [
          { 
            $match: { 
              is_deleted: { $ne: true },
              date: { $gte: ranges.week.start, $lte: ranges.week.end } 
            } 
          },
          { 
            $group: { 
              _id: '$type', 
              total: { $sum: '$amount' } 
            } 
          }
        ],
        month: [
          { 
            $match: { 
              is_deleted: { $ne: true },
              date: { $gte: ranges.month.start, $lte: ranges.month.end } 
            } 
          },
          { 
            $group: { 
              _id: '$type', 
              total: { $sum: '$amount' } 
            } 
          }
        ],
        year: [
          { 
            $match: { 
              is_deleted: { $ne: true },
              date: { $gte: ranges.year.start, $lte: ranges.year.end } 
            } 
          },
          { 
            $group: { 
              _id: '$type', 
              total: { $sum: '$amount' } 
            } 
          }
        ]
      }
    }
  ]);
  
  const summaries = {};
  
  for (const period of ['today', 'week', 'month', 'year']) {
    const periodData = result[period] || [];
    let inflow = 0;
    let outflow = 0;
    
    for (const item of periodData) {
      if (item._id === 'inflow') {
        inflow = item.total;
      } else if (item._id === 'outflow') {
        outflow = item.total;
      }
    }
    
    summaries[period] = {
      inflow,
      outflow,
      net: inflow - outflow
    };
  }
  
  cache.summaries = summaries;
  cache.summariesExpiry = Date.now() + SUMMARY_CACHE_TTL;
  cache.summariesLastUpdated = new Date();
  
  return summaries;
}

const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

async function getChartData(period = 'today') {
  if (isChartCacheValid(period)) {
    return cache.charts.get(period).data;
  }
  
  const ranges = getDateRanges();
  let groupBy, labels, dateRange;
  
  switch (period) {
    case 'today':
      groupBy = {
        block: {
          $floor: { 
            $divide: [
              { $hour: { date: '$date', timezone: VIETNAM_TIMEZONE } }, 
              3
            ] 
          }
        }
      };
      labels = ['0-3h', '3-6h', '6-9h', '9-12h', '12-15h', '15-18h', '18-21h', '21-24h'];
      dateRange = ranges.today;
      break;
      
    case 'week':
      groupBy = {
        dayOfWeek: { $dayOfWeek: { date: '$date', timezone: VIETNAM_TIMEZONE } }
      };
      labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dateRange = ranges.week;
      break;
      
    case 'month':
      groupBy = {
        week: {
          $ceil: { 
            $divide: [
              { $dayOfMonth: { date: '$date', timezone: VIETNAM_TIMEZONE } }, 
              7
            ] 
          }
        }
      };
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
      dateRange = ranges.month;
      break;
      
    case 'year':
      groupBy = {
        month: { $month: { date: '$date', timezone: VIETNAM_TIMEZONE } }
      };
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      dateRange = ranges.year;
      break;
      
    default:
      throw new Error(`Invalid period: ${period}`);
  }
  
  const chartAggregation = await Transaction.aggregate([
    {
      $match: {
        is_deleted: { $ne: true },
        date: { $gte: dateRange.start, $lte: dateRange.end }
      }
    },
    {
      $group: {
        _id: {
          ...groupBy,
          type: '$type'
        },
        total: { $sum: '$amount' }
      }
    },
    {
      $sort: { '_id.block': 1, '_id.dayOfWeek': 1, '_id.week': 1, '_id.month': 1 }
    }
  ]);
  
  const inflowData = new Array(labels.length).fill(0);
  const outflowData = new Array(labels.length).fill(0);
  
  for (const item of chartAggregation) {
    let index;
    
    switch (period) {
      case 'today':
        index = item._id.block || 0;
        break;
      case 'week':
        index = (item._id.dayOfWeek || 1) - 1;
        break;
      case 'month':
        index = (item._id.week || 1) - 1;
        break;
      case 'year':
        index = (item._id.month || 1) - 1;
        break;
    }
    
    if (index >= 0 && index < labels.length) {
      if (item._id.type === 'inflow') {
        inflowData[index] = item.total;
      } else if (item._id.type === 'outflow') {
        outflowData[index] = item.total;
      }
    }
  }
  
  const chartData = {
    labels,
    data: {
      inflow: inflowData,
      outflow: outflowData
    }
  };
  
  cache.charts.set(period, {
    data: chartData,
    expiry: Date.now() + CHART_CACHE_TTL
  });
  
  return chartData;
}


/**
 * Get summary for all periods + chart data for selected period
 */
async function getSummaryWithChart(chartPeriod = 'today') {
  const [summary, chart] = await Promise.all([
    calculateAllSummaries(),
    getChartData(chartPeriod)
  ]);
  
  return {
    summary,
    chart,
    lastUpdated: cache.summariesLastUpdated
  };
}


module.exports = {
  getSummaryWithChart,
  calculateAllSummaries,
  getChartData,
  invalidateCache,
  forceRefresh,
  getLastUpdated,
  
  _cache: cache,
  _isSummaryCacheValid: isSummaryCacheValid,
  _isChartCacheValid: isChartCacheValid
};