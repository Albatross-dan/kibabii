import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function CategoryProducts() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (slug) {
      navigate(`/categories?slug=${encodeURIComponent(slug)}`, { replace: true });
    } else {
      navigate('/categories', { replace: true });
    }
  }, [slug, navigate]);

  return null;
}

