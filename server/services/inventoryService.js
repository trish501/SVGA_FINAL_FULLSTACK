const Request = require('../models/Request');

const ACTIVE_DECISIONS = new Set([
  'approved',
  'issued',
  'reserved',
  'readyforcollection',
  'procured',
  'ordered',
  'arrived',
]);

async function getIssuedCountsByBookId() {
  const requests = await Request.find({
    status: { $in: ['Approved', 'Procured'] },
  }).select('selectedBookIds selectedBooks');

  const counts = {};

  for (const request of requests) {
    const bookIds = request.selectedBookIds || [];
    const selectedBooks = request.selectedBooks || [];

    bookIds.forEach((bookId, index) => {
      const book = selectedBooks[index];
      if (!book || book.returned) return;

      const decision = String(book.decision || 'approved').toLowerCase();
      if (decision === 'rejected') return;
      if (book.decision && !ACTIVE_DECISIONS.has(decision)) return;

      const id = String(bookId);
      counts[id] = (counts[id] || 0) + 1;
    });
  }

  return counts;
}

function attachAvailability(books, issuedCounts) {
  return books.map((book) => {
    const doc = book.toObject ? book.toObject() : { ...book };
    const issued = issuedCounts[String(doc._id)] || 0;
    const total = Number(doc.quantity) || 0;
    const available = Math.max(0, total - issued);
    return { ...doc, issuedCount: issued, availableQuantity: available };
  });
}

module.exports = { getIssuedCountsByBookId, attachAvailability };
