import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../../api/client.js';
import ProductRating from './ProductRating.jsx';

const PAGE_SIZE = 10;

function formatDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.valueOf()) ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
}

export default function Reviews({ productId, allowSubmit = true }) {
  const [summary, setSummary] = useState({ average_rating: 0, rating_count: 0 });
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const endpoint = Number.isInteger(Number(productId)) && Number(productId) > 0 ? `/wp-json/dtb/v1/products/${Number(productId)}/reviews` : null;

  const fetchPage = useCallback(async (requestedPage = 1, append = false) => {
    if (!endpoint) { setLoading(false); setError('Reviews are unavailable for this product.'); return; }
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    try {
      const data = await apiClient(`${endpoint}?page=${requestedPage}&per_page=${PAGE_SIZE}`);
      setSummary(data?.summary || { average_rating: 0, rating_count: 0 });
      setReviews((current) => append ? [...current, ...(data?.reviews || [])] : (data?.reviews || []));
      setPage(requestedPage);
      setHasMore(Boolean(data?.has_more));
    } catch (requestError) {
      setError(requestError?.message || 'Unable to load reviews right now.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [endpoint]);

  useEffect(() => { fetchPage(1); }, [fetchPage]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!endpoint || !content.trim()) return;
    setSubmitting(true); setSubmissionMessage(''); setError('');
    try {
      await apiClient(endpoint, { method: 'POST', body: JSON.stringify({ rating, content: content.trim() }) });
      setContent(''); setRating(5);
      setSubmissionMessage('Thanks — your review was submitted for moderation.');
      await fetchPage(1);
    } catch (requestError) {
      setError(requestError?.message || 'Unable to submit your review.');
    } finally { setSubmitting(false); }
  }

  return <div className="dtb-reviews">
    <div className="dtb-reviews__summary"><ProductRating rating={summary.average_rating} ratingCount={summary.rating_count} /></div>
    {allowSubmit && <form onSubmit={handleSubmit} className="dtb-reviews__form">
      <p className="dtb-reviews__form-heading">Write a review</p>
      <p className="dtb-reviews__form-note">You must be signed in. Submitted reviews are moderated before publishing.</p>
      <fieldset className="dtb-reviews__field"><legend className="dtb-reviews__label">Rating</legend><div className="dtb-reviews__star-picker">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} onClick={() => setRating(value)} className={`dtb-reviews__star-btn${value <= rating ? ' is-active' : ''}`} aria-label={`${value} star${value === 1 ? '' : 's'}`} aria-pressed={value === rating}>★</button>)}</div></fieldset>
      <div className="dtb-reviews__field"><label className="dtb-reviews__label" htmlFor="dtb-review-content">Review</label><textarea id="dtb-review-content" className="dtb-reviews__textarea" rows={4} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Share your experience with this product." required /></div>
      <button type="submit" className="dtb-reviews__submit" disabled={submitting || !endpoint}>{submitting ? 'Submitting…' : 'Submit review'}</button>
      {submissionMessage && <p className="dtb-reviews__notice" role="status">{submissionMessage}</p>}
    </form>}
    {error && <p className="dtb-reviews__error" role="alert">{error}</p>}
    <div className="dtb-reviews__list" aria-busy={loading}>
      {loading ? <p className="dtb-reviews__empty">Loading reviews…</p> : reviews.length === 0 ? <p className="dtb-reviews__empty">No reviews yet.</p> : reviews.map((review) => <article key={review.id} className="dtb-reviews__item"><div className="dtb-reviews__item-header"><div className="dtb-reviews__item-meta"><span className="dtb-reviews__item-author">{review.author}</span><ProductRating rating={review.rating} ratingCount={1} compact />{review.verified_purchase && <span className="dtb-reviews__verified">Verified purchase</span>}</div><time className="dtb-reviews__item-date" dateTime={review.date}>{formatDate(review.date)}</time></div><p className="dtb-reviews__item-text">{review.content}</p></article>)}
    </div>
    {hasMore && <button type="button" className="dtb-reviews__more" onClick={() => fetchPage(page + 1, true)} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more reviews'}</button>}
  </div>;
}
