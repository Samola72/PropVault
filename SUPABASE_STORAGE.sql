-- ============================================================
-- PROPVAULT - STORAGE BUCKETS & POLICIES
-- Run this script AFTER the RLS policies
-- ============================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('property-images', 'property-images', true, 10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('work-order-images', 'work-order-images', true, 10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('documents', 'documents', false, 52428800,
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('avatars', 'avatars', true, 5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Storage policies for property-images
CREATE POLICY "Org members can view property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

CREATE POLICY "Managers can upload property images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-images'
    AND auth.uid() IS NOT NULL
  );

-- Storage policies for work-order-images
CREATE POLICY "Org members can view work order images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'work-order-images');

CREATE POLICY "Members can upload work order images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'work-order-images'
    AND auth.uid() IS NOT NULL
  );

-- Storage policies for documents
CREATE POLICY "Org members can view their documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Org members can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- Storage policies for avatars
CREATE POLICY "Users can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
  );
