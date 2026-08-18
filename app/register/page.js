'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_PROFILE_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const initialFormData = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  role: 'passenger',
  licenseNo: '',
  orgName: '',
};

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState(initialFormData);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] =
    useState('');

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] =
    useState('');
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  useEffect(() => {
    return () => {
      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview);
      }
    };
  }, [profileImagePreview]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setError('');
    setSuccessMessage('');
  }

  function handleProfileImageChange(event) {
    const selectedFile = event.target.files?.[0];

    setError('');
    setSuccessMessage('');

    if (!selectedFile) {
      setProfileImage(null);

      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview);
      }

      setProfileImagePreview('');
      return;
    }

    if (
      !ALLOWED_PROFILE_IMAGE_TYPES.includes(
        selectedFile.type
      )
    ) {
      event.target.value = '';
      setProfileImage(null);
      setError(
        'Profile picture must be a JPG, PNG, or WebP image.'
      );
      return;
    }

    if (selectedFile.size > MAX_PROFILE_IMAGE_SIZE) {
      event.target.value = '';
      setProfileImage(null);
      setError(
        'Profile picture must not exceed 5 MB.'
      );
      return;
    }

    if (profileImagePreview) {
      URL.revokeObjectURL(profileImagePreview);
    }

    setProfileImage(selectedFile);
    setProfileImagePreview(
      URL.createObjectURL(selectedFile)
    );
  }

  function removeProfileImage() {
    if (profileImagePreview) {
      URL.revokeObjectURL(profileImagePreview);
    }

    setProfileImage(null);
    setProfileImagePreview('');
    setError('');

    const imageInput =
      document.getElementById('profileImage');

    if (imageInput) {
      imageInput.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError(
        'Password must be at least 6 characters long.'
      );
      return;
    }

    if (
      formData.role === 'driver' &&
      (
        !formData.licenseNo.trim() ||
        !formData.orgName.trim()
      )
    ) {
      setError(
        'Driving license number and transport organization are required.'
      );
      return;
    }

    const requestData = new FormData();

    requestData.append('name', formData.name);
    requestData.append('email', formData.email);
    requestData.append('phone', formData.phone);
    requestData.append('password', formData.password);
    requestData.append('role', formData.role);

    if (formData.role === 'driver') {
      requestData.append(
        'licenseNo',
        formData.licenseNo
      );

      requestData.append(
        'orgName',
        formData.orgName
      );
    }

    if (profileImage) {
      requestData.append(
        'profileImage',
        profileImage
      );
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccessMessage('');

      const response = await fetch(
        '/api/auth/register',
        {
          method: 'POST',
          body: requestData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || 'Registration failed.'
        );
        return;
      }

      setSuccessMessage(data.message);
      setFormData(initialFormData);
      removeProfileImage();

      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (requestError) {
      console.error(
        'Registration request failed:',
        requestError
      );

      setError(
        'Unable to connect to the server. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-2xl font-bold text-blue-700"
          >
            SmartTransit
          </Link>

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Create an account
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Register as a passenger or driver
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {successMessage} Redirecting to login...
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="role"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Account type
            </label>

            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="passenger">
                Passenger
              </option>

              <option value="driver">
                Driver
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="profileImage"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Profile picture
              <span className="ml-1 font-normal text-slate-500">
                (optional)
              </span>
            </label>

            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
              {profileImagePreview ? (
                <div className="flex flex-col items-center">
                  <Image
                    src={profileImagePreview}
                    alt="Selected profile preview"
                    width={128}
                    height={128}
                    unoptimized
                    className="h-32 w-32 rounded-full object-cover ring-4 ring-white shadow-md"
                  />

                  <p className="mt-3 max-w-full truncate text-sm font-medium text-slate-700">
                    {profileImage?.name}
                  </p>

                  <button
                    type="button"
                    onClick={removeProfileImage}
                    className="mt-3 text-sm font-semibold text-red-600 hover:underline"
                  >
                    Remove picture
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-slate-600">
                    Upload a JPG, PNG, or WebP image
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Maximum file size: 5 MB
                  </p>
                </div>
              )}

              <input
                id="profileImage"
                name="profileImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleProfileImageChange}
                className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-100 file:px-4 file:py-2.5 file:font-semibold file:text-blue-700 hover:file:bg-blue-200"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Full name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Phone number
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="01712345678"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {formData.role === 'driver' && (
            <div className="space-y-5 rounded-xl border border-blue-100 bg-blue-50 p-5">
              <div>
                <label
                  htmlFor="licenseNo"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Driving license number
                </label>

                <input
                  id="licenseNo"
                  name="licenseNo"
                  type="text"
                  value={formData.licenseNo}
                  onChange={handleChange}
                  placeholder="Enter your license number"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="orgName"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Transport organization
                </label>

                <input
                  id="orgName"
                  name="orgName"
                  type="text"
                  value={formData.orgName}
                  onChange={handleChange}
                  placeholder="Enter organization name"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <p className="text-xs leading-5 text-blue-800">
                Driver accounts remain pending until email
                verification and administrator approval.
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              minLength={6}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Confirm password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              minLength={6}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              Boolean(successMessage)
            }
            className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? 'Creating account...'
              : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-blue-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}