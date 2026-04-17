import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import {
  FiUser,
  FiMail,
  FiLock,
  FiArrowRight,
  FiArrowLeft,
  FiCheck,
  FiMapPin,
  FiPhone,
  FiCalendar,
  FiCamera,
  FiUpload,
} from 'react-icons/fi';
import { GiSoccerBall } from 'react-icons/gi';
import useAuthStore from '../../store/authStore';

const resizeImageToBase64 = (file, maxSize = 400) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Calculate minimum date (must be at least 5 years old to register)
const getMaxDate = () => {
  const today = new Date();
  today.setFullYear(today.getFullYear() - 5);
  return today.toISOString().split('T')[0];
};

// Calculate a reasonable minimum date (100 years ago)
const getMinDate = () => {
  const today = new Date();
  today.setFullYear(today.getFullYear() - 100);
  return today.toISOString().split('T')[0];
};

const registerSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required').max(50, 'First name cannot exceed 50 characters'),
    last_name: z.string().min(1, 'Last name is required').max(50, 'Last name cannot exceed 50 characters'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be less than 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Please enter a valid email address'),
    date_of_birth: z.string().min(1, 'Date of birth is required').refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const minAge = 5;
      const maxAge = 100;
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= minAge && age <= maxAge;
    }, 'Please enter a valid date of birth'),
    phone: z.string().optional(),
    location: z.string().optional(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
    ageConsent: z.boolean().refine((val) => val === true, {
      message: 'You must confirm you are 18+ or have parental consent',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const steps = [
  { id: 1, title: 'Account', description: 'Basic info' },
  { id: 2, title: 'Profile', description: 'Your details' },
  { id: 3, title: 'Security', description: 'Set password' },
  { id: 4, title: 'Photo', description: 'Profile picture' },
];

const FormInput = ({ label, icon: Icon, error, helperText, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-[#64748b] uppercase tracking-wider mb-2">
      {label}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />}
      <input
        className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3 bg-[#141c28] border rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#4ade80]/50 transition-colors ${
          error ? 'border-[#ef4444]' : 'border-[#2a3a4d]'
        }`}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-[#ef4444]">{error}</p>}
    {helperText && !error && <p className="mt-1 text-xs text-[#64748b]">{helperText}</p>}
  </div>
);

const RegisterForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const { register: registerUser, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      date_of_birth: '',
      phone: '',
      location: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
      ageConsent: false,
    },
  });

  const password = watch('password');

  const passwordRequirements = [
    { label: 'At least 6 characters', met: password?.length >= 6 },
  ];

  const handleNext = async () => {
    let fieldsToValidate = [];
    if (currentStep === 1) {
      fieldsToValidate = ['first_name', 'last_name', 'username', 'email', 'date_of_birth'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['phone', 'location'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const { confirmPassword: _c, agreeToTerms: _a, ageConsent: _ac, ...userData } = data;
      const result = await registerUser(userData);
      setRegisteredUser(result);
      toast.success('Account created! Add a profile photo.');
      setCurrentStep(4);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoFile = async (file) => {
    if (!file?.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB');
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const base64 = await resizeImageToBase64(file);
      setAvatarPreview(base64);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handlePhotoFile(e.dataTransfer.files?.[0]);
  };

  const handleUploadAndContinue = async () => {
    if (!avatarPreview) { navigate('/dashboard'); return; }
    setIsUploadingAvatar(true);
    try {
      const userId = registeredUser?.data?.user?.id || registeredUser?.user?.id || registeredUser?.id;
      if (userId) {
        const { usersAPI } = await import('../../api/users');
        const response = await usersAPI.update(userId, { avatar: avatarPreview });
        updateUser(response.data.user);
      }
      toast.success('Profile photo saved!');
    } catch {
      toast.error('Photo save failed, but your account is ready!');
    } finally {
      setIsUploadingAvatar(false);
      navigate('/dashboard');
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1a5f2a] mb-6">
          {currentStep === 4 ? (
            <FiCamera className="w-8 h-8 text-[#4ade80]" />
          ) : (
            <GiSoccerBall className="w-8 h-8 text-[#4ade80]" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {currentStep === 4 ? 'Add a Profile Photo' : 'Join SoccerConnect'}
        </h1>
        <p className="text-[#64748b]">
          {currentStep === 4
            ? 'Help other players recognise you — you can always change it later'
            : 'Create your account and start playing'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                  transition-all duration-300
                  ${
                    currentStep > step.id
                      ? 'bg-[#1a5f2a] text-[#4ade80]'
                      : currentStep === step.id
                      ? 'bg-[#1a5f2a]/20 text-[#4ade80] border-2 border-[#22c55e]'
                      : 'bg-[#141c28] text-[#64748b] border border-[#2a3a4d]'
                  }
                `}
              >
                {currentStep > step.id ? <FiCheck size={18} /> : step.id}
              </div>
              <div className="mt-2 text-center hidden sm:block">
                <p
                  className={`text-xs font-medium ${
                    currentStep >= step.id ? 'text-white' : 'text-[#64748b]'
                  }`}
                >
                  {step.title}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-[#22c55e]' : 'bg-[#2a3a4d]'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Step 1: Account Info */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormInput
                label="First Name"
                placeholder="John"
                icon={FiUser}
                error={errors.first_name?.message}
                {...register('first_name')}
              />
              <FormInput
                label="Last Name"
                placeholder="Doe"
                icon={FiUser}
                error={errors.last_name?.message}
                {...register('last_name')}
              />
            </div>
            <FormInput
              label="Username"
              placeholder="johndoe"
              icon={FiUser}
              error={errors.username?.message}
              helperText="This will be your unique identifier"
              {...register('username')}
            />
            <FormInput
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              icon={FiMail}
              error={errors.email?.message}
              {...register('email')}
            />
            <FormInput
              label="Date of Birth"
              type="date"
              icon={FiCalendar}
              error={errors.date_of_birth?.message}
              min={getMinDate()}
              max={getMaxDate()}
              helperText="Required for age verification"
              {...register('date_of_birth')}
            />
          </div>
        )}

        {/* Step 2: Profile Info */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <FormInput
              label="Phone Number (Optional)"
              type="tel"
              placeholder="(416) 555-1234"
              icon={FiPhone}
              error={errors.phone?.message}
              {...register('phone')}
            />
            <FormInput
              label="Location (Optional)"
              placeholder="Toronto, ON"
              icon={FiMapPin}
              error={errors.location?.message}
              helperText="Help others find players in your area"
              {...register('location')}
            />
            <div className="bg-[#141c28] border border-[#2a3a4d] rounded-lg p-4">
              <p className="text-sm text-[#94a3b8]">
                <span className="text-[#4ade80] font-medium">Pro tip:</span> Adding your
                location helps you find nearby pickup games and teams looking for players
                in your area.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Security */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <FormInput
              label="Password"
              type="password"
              placeholder="Create a strong password"
              icon={FiLock}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex flex-wrap gap-3">
              {passwordRequirements.map((req, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 text-xs ${
                    req.met ? 'text-[#4ade80]' : 'text-[#64748b]'
                  }`}
                >
                  <FiCheck className={`w-3 h-3 ${req.met ? 'opacity-100' : 'opacity-30'}`} />
                  {req.label}
                </div>
              ))}
            </div>

            <FormInput
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              icon={FiLock}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {/* Age Consent Checkbox */}
            <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-[#2a3a4d] bg-[#141c28] text-[#22c55e] focus:ring-[#22c55e] focus:ring-offset-[#0d1219]"
                  {...register('ageConsent')}
                />
                <span className="text-sm text-[#94a3b8]">
                  <strong className="text-[#f59e0b]">Age Requirement:</strong> I confirm that I am 18 years or older,
                  OR I have parental/guardian consent to use this platform.
                </span>
              </label>
              {errors.ageConsent && (
                <p className="text-xs text-[#ef4444] mt-2">{errors.ageConsent.message}</p>
              )}
            </div>

            {/* Terms Agreement Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 rounded border-[#2a3a4d] bg-[#141c28] text-[#22c55e] focus:ring-[#22c55e] focus:ring-offset-[#0d1219]"
                {...register('agreeToTerms')}
              />
              <span className="text-sm text-[#94a3b8]">
                I agree to the{' '}
                <Link to="/terms" className="text-[#4ade80] hover:text-[#22c55e]" target="_blank">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-[#4ade80] hover:text-[#22c55e]" target="_blank">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.agreeToTerms && (
              <p className="text-xs text-[#ef4444]">{errors.agreeToTerms.message}</p>
            )}
          </div>
        )}

        {/* Step 4: Photo Upload Card (outside normal nav flow) */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { handlePhotoFile(e.target.files?.[0]); e.target.value = ''; }}
            />

            {/* Drop / Preview zone */}
            <div
              onClick={() => !avatarPreview && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden
                ${avatarPreview ? 'border-[#22c55e]/50 cursor-default' : isDragging ? 'border-[#22c55e] bg-[#22c55e]/5' : 'border-[#2a3a4d] hover:border-[#22c55e]/50 hover:bg-[#22c55e]/5'}`}
              style={{ height: 220 }}
            >
              {isUploadingAvatar ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[#64748b]">Processing…</p>
                </div>
              ) : avatarPreview ? (
                <>
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] text-white rounded-lg text-sm font-medium"
                    >
                      <FiCamera className="w-4 h-4" /> Change Photo
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#141c28] border-2 border-[#2a3a4d] flex items-center justify-center">
                    <FiUpload className="w-7 h-7 text-[#4ade80]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Drag & drop or click to upload</p>
                    <p className="text-xs text-[#64748b] mt-1">JPG, PNG or GIF · Max 5 MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 bg-[#141c28] text-[#64748b] font-medium rounded-lg border border-[#2a3a4d] hover:text-white hover:border-[#3d4f63] transition-all text-sm"
              >
                Not Now
              </button>
              <button
                type="button"
                onClick={handleUploadAndContinue}
                disabled={isUploadingAvatar || !avatarPreview}
                className="flex-1 py-3 bg-[#1a5f2a] text-[#4ade80] font-semibold rounded-lg border border-[#22c55e]/30 hover:bg-[#22723a] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isUploadingAvatar ? (
                  <span className="w-4 h-4 border-2 border-[#4ade80]/30 border-t-[#4ade80] rounded-full animate-spin" />
                ) : (
                  <FiCheck className="w-5 h-5" />
                )}
                Save & Continue
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons (steps 1–3 only) */}
        {currentStep < 4 && (
        <div className="flex gap-4 pt-4">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-3 bg-[#141c28] text-white font-semibold rounded-lg border border-[#2a3a4d] hover:bg-[#1c2430] hover:border-[#3d4f63] transition-all flex items-center justify-center gap-2"
            >
              <FiArrowLeft className="w-5 h-5" />
              Back
            </button>
          )}
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 bg-[#1a5f2a] text-[#4ade80] font-semibold rounded-lg border border-[#22c55e]/30 hover:bg-[#22723a] hover:border-[#4ade80]/50 transition-all flex items-center justify-center gap-2"
            >
              Continue
              <FiArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-[#1a5f2a] text-[#4ade80] font-semibold rounded-lg border border-[#22c55e]/30 hover:bg-[#22723a] hover:border-[#4ade80]/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-[#4ade80]/30 border-t-[#4ade80] rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Account
                  <FiCheck className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
        )}
      </form>

      {/* Login Link */}
      {currentStep < 4 && (
        <p className="mt-8 text-center text-[#64748b]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[#4ade80] hover:text-[#22c55e] font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
};

export default RegisterForm;
