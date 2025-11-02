/**
 * 从语音文本中提取旅行信息
 */

interface ParsedTravelInfo {
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  description: string;
}

/**
 * 解析目的地
 */
function parseDestination(text: string): string | undefined {
  // 匹配"去xxx"、"到xxx"、"想去xxx"等模式
  const patterns = [
    /(?:去|到|想去|前往|旅游去|出发去)\s*([^\s，,。！!？?]{2,}?)(?:旅游|旅行|玩|游玩)?/,
    /目的地(?:是|为|：|:)?\s*([^\s，,。！!？?]{2,})/,
    /([^\s，,。！!？?]{2,}?)(?:旅游|旅行|游玩|自由行|自驾游)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const destination = match[1].trim();
      // 过滤掉一些常见的非目的地词汇
      const excludeWords = ['几天', '多久', '什么时候', '多少钱', '预算', '想要', '喜欢', '打算'];
      if (!excludeWords.some(word => destination.includes(word)) && destination.length >= 2) {
        return destination;
      }
    }
  }

  return undefined;
}

/**
 * 解析日期
 */
function parseDates(text: string): { startDate?: string; endDate?: string } {
  const result: { startDate?: string; endDate?: string } = {};
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const dates: Date[] = [];

  // 先匹配"X月X日到X日"或"X月X号到X号"这种省略第二个月份的格式
  const sameMonthPattern = /(\d{1,2})月(\d{1,2})[日号](?:到|至|-|~)(\d{1,2})[日号]?/g;
  let sameMonthMatch;

  while ((sameMonthMatch = sameMonthPattern.exec(text)) !== null) {
    const month = Number.parseInt(sameMonthMatch[1]);
    const day1 = Number.parseInt(sameMonthMatch[2]);
    const day2 = Number.parseInt(sameMonthMatch[3]);

    let year = currentYear;
    // 如果月份小于当前月份，可能是指明年
    if (month < currentMonth) {
      year = currentYear + 1;
    }

    if (month >= 1 && month <= 12) {
      if (day1 >= 1 && day1 <= 31) {
        const date1 = new Date(year, month - 1, day1, 12, 0, 0, 0);
        dates.push(date1);
      }
      if (day2 >= 1 && day2 <= 31) {
        const date2 = new Date(year, month - 1, day2, 12, 0, 0, 0);
        dates.push(date2);
      }
    }
  }

  // 如果已经匹配到了日期范围，就不需要继续匹配其他格式了
  if (dates.length >= 2) {
    // 排序日期
    dates.sort((a, b) => a.getTime() - b.getTime());

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    result.startDate = formatDate(dates[0]);
    result.endDate = formatDate(dates[1]);
    return result;
  }

  // 匹配具体日期格式：2024年11月1日、11月1日、11-1、2024-11-01等
  const datePatterns = [
    /(\d{4})[年\-/](\d{1,2})[月\-/](\d{1,2})[日号]?/g,
    /(\d{1,2})[月\-/](\d{1,2})[日号]?/g,
  ];

  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let year, month, day;

      if (match.length === 4) {
        // 有年份
        year = Number.parseInt(match[1]);
        month = Number.parseInt(match[2]);
        day = Number.parseInt(match[3]);
      } else if (match.length === 3) {
        // 没有年份，使用当前年份或下一年
        year = currentYear;
        month = Number.parseInt(match[1]);
        day = Number.parseInt(match[2]);

        // 如果月份小于当前月份，可能是指明年
        if (month < currentMonth) {
          year = currentYear + 1;
        }
      } else {
        continue;
      }

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day, 12, 0, 0, 0);
        dates.push(date);
      }
    }
  }

  // 匹配相对日期：下周、下个月、本周末等
  const relativeDatePatterns = [
    { pattern: /下周/, offset: 7 },
    { pattern: /下个月/, offset: 30 },
    { pattern: /下月/, offset: 30 },
    { pattern: /后天/, offset: 2 },
    { pattern: /明天/, offset: 1 },
  ];

  for (const { pattern, offset } of relativeDatePatterns) {
    if (pattern.test(text)) {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      date.setHours(12, 0, 0, 0); // 设置为正午，避免时区问题
      dates.push(date);
    }
  }

  // 匹配天数：5天、3天2夜、一周等
  const durationPatterns = [
    /([一二三四五六七八九十\d]+)[天日]/,
    /([一二三四五六七八九十\d]+)周/,
  ];

  let duration: number | undefined;

  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      let num = match[1];
      // 转换中文数字
      const chineseNumbers: { [key: string]: number } = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
      };

      if (chineseNumbers[num]) {
        duration = chineseNumbers[num];
      } else if (/\d+/.test(num)) {
        duration = parseInt(num);
      }

      if (pattern.source.includes('周')) {
        duration = duration ? duration * 7 : undefined;
      }

      break;
    }
  }

  // 排序日期
  dates.sort((a, b) => a.getTime() - b.getTime());

  // 格式化日期为 YYYY-MM-DD，避免时区问题
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (dates.length >= 2) {
    // 有两个明确日期
    result.startDate = formatDate(dates[0]);
    result.endDate = formatDate(dates[1]);
  } else if (dates.length === 1 && duration) {
    // 有一个日期和天数
    result.startDate = formatDate(dates[0]);
    const endDate = new Date(dates[0]);
    endDate.setDate(endDate.getDate() + duration);
    result.endDate = formatDate(endDate);
  } else if (dates.length === 1) {
    // 只有一个日期
    result.startDate = formatDate(dates[0]);
  }

  return result;
}

/**
 * 解析预算
 */
function parseBudget(text: string): number | undefined {
  // 匹配预算相关的模式
  const patterns = [
    /预算(?:是|为|：|:)?\s*([一二三四五六七八九十万千百\d]+)\s*(?:元|块|rmb)?/i,
    /(?:大概|大约|左右|预计)?\s*([一二三四五六七八九十万千百\d]+)\s*(?:元|块|rmb)(?:左右|预算)?/i,
    /(\d+)\s*(?:元|块|rmb)(?:以内|左右|预算)?/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let numStr = match[1];

      // 转换中文数字
      if (/[一二三四五六七八九十万千百]/.test(numStr)) {
        numStr = convertChineseNumber(numStr);
      }

      const num = parseInt(numStr);
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  }

  return undefined;
}

/**
 * 转换中文数字为阿拉伯数字
 */
function convertChineseNumber(chinese: string): string {
  const numberMap: { [key: string]: number } = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
    '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
    '十': 10, '百': 100, '千': 1000, '万': 10000,
  };

  let result = 0;
  let temp = 0;
  let unit = 1;

  for (let i = chinese.length - 1; i >= 0; i--) {
    const char = chinese[i];
    const num = numberMap[char];

    if (num === undefined) continue;

    if (num >= 10) {
      if (num > unit) {
        unit = num;
        if (temp === 0) temp = 1;
      }
    } else {
      temp = num;
    }

    if (temp > 0 && unit > 0) {
      result += temp * unit;
      temp = 0;
      if (num < 10) {
        unit = 1;
      }
    }
  }

  return result.toString();
}

/**
 * 主解析函数
 */
export function parseVoiceInput(text: string): ParsedTravelInfo {
  const destination = parseDestination(text);
  const { startDate, endDate } = parseDates(text);
  const budget = parseBudget(text);

  return {
    destination,
    startDate,
    endDate,
    budget,
    description: text,
  };
}

/**
 * 将解析结果应用到表单
 */
export function applyParsedInfoToForm(
  parsedInfo: ParsedTravelInfo,
  formInstance: any,
  dayjsInstance: any
) {
  const updates: any = {};

  if (parsedInfo.destination) {
    updates.destination = parsedInfo.destination;
  }

  if (parsedInfo.startDate && parsedInfo.endDate) {
    updates.dateRange = [
      dayjsInstance(parsedInfo.startDate),
      dayjsInstance(parsedInfo.endDate),
    ];
  }

  if (parsedInfo.budget) {
    updates.budget = parsedInfo.budget;
  }

  if (parsedInfo.description) {
    updates.description = parsedInfo.description;
  }

  formInstance.setFieldsValue(updates);

  return updates;
}

