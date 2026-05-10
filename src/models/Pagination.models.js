const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

class Pagination {
  constructor({ total = 0, page = 1, limit = 20 }) {
    const safeTotal = Number.isFinite(Number(total)) ? Number(total) : 0;
    const safePage = parsePositiveInteger(page, 1);
    const safeLimit = parsePositiveInteger(limit, 20);
    const totalPages = safeLimit > 0 ? Math.ceil(safeTotal / safeLimit) : 0;

    this.total = safeTotal;
    this.page = safePage;
    this.limit = safeLimit;
    this.totalPages = totalPages;
    this.hasNextPage = safePage < totalPages;
    this.hasPreviousPage = safePage > 1 && totalPages > 0;
  }

  static normalize({ page = 1, limit = 20 } = {}) {
    return {
      page: parsePositiveInteger(page, 1),
      limit: parsePositiveInteger(limit, 20)
    };
  }

  static set(args = {}) {
    return new Pagination(args);
  }
}

module.exports = Pagination;
