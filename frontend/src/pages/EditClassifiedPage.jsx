import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiSave, FiUpload, FiX } from 'react-icons/fi';
import { classifiedsAPI } from '../api/classifieds';
import { Loading } from '../components/common';

const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  classified_type: z.enum(['looking_for_players', 'looking_for_team', 'equipment_sale', 'equipment_wanted', 'coaching', 'other']),
  condition: z.enum(['new', 'like-new', 'good', 'fair']).optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  location: z.string().min(3, 'Location is required'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
});

const InputField = ({ label, error, ...props }) => (
  <div className="space-y-2">
    <label className="text-xs uppercase tracking-wider text-[#64748b]">{label}</label>
    <input
      className={`w-full bg-[#141c28] border ${error ? 'border-[#ef4444]' : 'border-[#2a3a4d]'} rounded-lg px-4 py-3 text-white placeholder-[#64748b] focus:outline-none focus:border-[#22c55e] transition-colors`}
      {...props}
    />
    {error && <p className="text-xs text-[#ef4444]">{error}</p>}
  </div>
);

const DEFAULT_IMAGE = 'https://placehold.co/800x600/0d4a1a/4ade80?text=Soccer+Connect';

const EditClassifiedPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImages, setCurrentImages] = useState([]);
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);

  const categories = [
    { value: 'looking_for_players', label: 'Looking for Players' },
    { value: 'looking_for_team', label: 'Looking for Team' },
    { value: 'equipment_sale', label: 'Equipment for Sale' },
    { value: 'equipment_wanted', label: 'Equipment Wanted' },
    { value: 'coaching', label: 'Coaching' },
    { value: 'other', label: 'Other' },
  ];

  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'like-new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
  ];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(listingSchema),
  });

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setIsLoading(true);
        const response = await classifiedsAPI.getById(id);
        const data = response.data?.classified || response.classified || response;
        reset({
          title: data.title || '',
          classified_type: data.classified_type || 'other',
          condition: data.condition || 'good',
          price: data.price || 0,
          location: data.location || '',
          description: data.description || '',
        });
        setCurrentImages(data.images?.length ? data.images : [DEFAULT_IMAGE]);
      } catch (error) {
        toast.error('Failed to load listing');
        navigate('/classifieds');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const watchedType = watch('classified_type');
  const showCondition = watchedType === 'equipment_sale' || watchedType === 'equipment_wanted';
  const showPrice = watchedType === 'equipment_sale' || watchedType === 'coaching';

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  };

  const removeNewImage = () => {
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setNewImageFile(null);
    setNewImagePreview(null);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let images = currentImages.filter(u => u !== DEFAULT_IMAGE);
      if (newImageFile) {
        const { uploadImage } = await import('../api/upload');
        const url = await uploadImage(newImageFile, 'soccer-connect/classifieds');
        images = [url, ...images];
      }
      await classifiedsAPI.update(id, { ...data, images });
      toast.success('Listing updated successfully!');
      navigate(`/classifieds/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#0a0e14]">
        <Loading size="lg" text="Loading listing..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[#64748b] hover:text-white mb-4 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
            <h1 className="text-2xl font-bold text-white tracking-tight">EDIT LISTING</h1>
          </div>
          <p className="text-[#64748b] text-sm">Update your classified listing</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Photos */}
          <div className="bg-[#0d1219] border border-[#1c2430] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1c2430]">
              <span className="text-xs uppercase tracking-wider text-[#64748b]">Listing Photo</span>
            </div>
            <div className="p-6">
              {/* Current cover image */}
              <div className="relative h-44 rounded-lg overflow-hidden border border-[#2a3a4d] mb-4">
                <img
                  src={newImagePreview || currentImages[0] || DEFAULT_IMAGE}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                {(newImagePreview || currentImages[0] === DEFAULT_IMAGE) && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-[#0d1219]/80 rounded text-[10px] text-[#64748b]">
                    {newImagePreview ? 'New photo (not saved yet)' : 'Default Soccer Connect image'}
                  </div>
                )}
                {newImagePreview && (
                  <button
                    type="button"
                    onClick={removeNewImage}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#0d1219]/80 text-white flex items-center justify-center hover:bg-[#ef4444] transition-colors"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
              <label className="flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-[#2a3a4d] rounded-lg cursor-pointer hover:border-[#f59e0b]/50 text-[#64748b] hover:text-white transition-colors text-sm">
                <FiUpload className="w-4 h-4" />
                {newImagePreview ? 'Change photo' : 'Upload a new photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
            </div>
          </div>

          {/* Title */}
          <div className="bg-[#0d1219] border border-[#1c2430] rounded-lg p-6">
            <InputField
              label="Listing Title"
              placeholder="What are you selling or looking for?"
              error={errors.title?.message}
              {...register('title')}
            />
          </div>

          {/* Category */}
          <div className="bg-[#0d1219] border border-[#1c2430] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1c2430]">
              <span className="text-xs uppercase tracking-wider text-[#64748b]">Category</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map(cat => (
                  <label key={cat.value} className="cursor-pointer">
                    <input
                      type="radio"
                      value={cat.value}
                      {...register('classified_type')}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border text-center text-sm transition-colors ${
                      watch('classified_type') === cat.value
                        ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#4ade80]'
                        : 'bg-[#141c28] border-[#2a3a4d] text-[#94a3b8] hover:border-[#3d4f63]'
                    }`}>
                      {cat.label}
                    </div>
                  </label>
                ))}
              </div>
              {errors.classified_type && (
                <p className="text-xs text-[#ef4444] mt-2">{errors.classified_type.message}</p>
              )}
            </div>
          </div>

          {/* Condition & Price */}
          {(showCondition || showPrice) && (
            <div className="bg-[#0d1219] border border-[#1c2430] rounded-lg p-6 space-y-6">
              {showCondition && (
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-[#64748b]">Condition</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {conditions.map(cond => (
                      <label key={cond.value} className="cursor-pointer">
                        <input
                          type="radio"
                          value={cond.value}
                          {...register('condition')}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border text-center text-sm transition-colors ${
                          watch('condition') === cond.value
                            ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#4ade80]'
                            : 'bg-[#141c28] border-[#2a3a4d] text-[#94a3b8] hover:border-[#3d4f63]'
                        }`}>
                          {cond.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {showPrice && (
                <InputField
                  label="Price ($)"
                  type="number"
                  min="0"
                  placeholder="0"
                  error={errors.price?.message}
                  {...register('price', { valueAsNumber: true })}
                />
              )}
            </div>
          )}

          {/* Location & Description */}
          <div className="bg-[#0d1219] border border-[#1c2430] rounded-lg p-6 space-y-6">
            <InputField
              label="Location"
              placeholder="City or neighborhood"
              error={errors.location?.message}
              {...register('location')}
            />
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-[#64748b]">Description</label>
              <textarea
                className={`w-full bg-[#141c28] border ${errors.description ? 'border-[#ef4444]' : 'border-[#2a3a4d]'} rounded-lg px-4 py-3 text-white placeholder-[#64748b] focus:outline-none focus:border-[#22c55e] min-h-[150px] resize-none`}
                placeholder="Describe the item or opportunity in detail..."
                {...register('description')}
              />
              {errors.description && <p className="text-xs text-[#ef4444]">{errors.description.message}</p>}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3 bg-[#141c28] border border-[#2a3a4d] text-white rounded-lg font-medium hover:bg-[#1c2430] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#22c55e] text-white rounded-lg font-medium hover:bg-[#16a34a] transition-colors disabled:opacity-50 shadow-lg shadow-[#22c55e]/25"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSave className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClassifiedPage;
