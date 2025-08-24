// lib/validation.ts
export interface ListingFormData {
  title: string;
  description: string;
  price: string;
  make: string;
  model: string;
  year: string;
  mileage: string;
  vin: string;
  condition: string;
  city: string;
  zipCode: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

export const validateListingForm = (formData: ListingFormData, images: string[]): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Required fields
  if (!formData.title.trim()) {
    errors.title = 'Title is required';
  } else if (formData.title.length < 10) {
    errors.title = 'Title must be at least 10 characters long';
  }

  if (!formData.description.trim()) {
    errors.description = 'Description is required';
  } else if (formData.description.length < 50) {
    errors.description = 'Description must be at least 50 characters long';
  }

  if (!formData.price.trim()) {
    errors.price = 'Price is required';
  } else {
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      errors.price = 'Price must be a valid positive number';
    } else if (price > 1000000) {
      errors.price = 'Price seems unrealistic. Please check the amount';
    }
  }

  if (!formData.make.trim()) {
    errors.make = 'Make is required';
  }

  if (!formData.model.trim()) {
    errors.model = 'Model is required';
  }

  if (!formData.year.trim()) {
    errors.year = 'Year is required';
  } else {
    const year = parseInt(formData.year);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > currentYear + 1) {
      errors.year = `Year must be between 1900 and ${currentYear + 1}`;
    }
  }

  if (!formData.condition.trim()) {
    errors.condition = 'Condition is required';
  }

  if (!formData.city.trim()) {
    errors.city = 'City is required';
  }

  if (!formData.zipCode.trim()) {
    errors.zipCode = 'Zip code is required';
  } else if (!/^\d{5}$/.test(formData.zipCode)) {
    errors.zipCode = 'Zip code must be 5 digits';
  }

  // VIN validation (if provided)
  if (formData.vin.trim() && formData.vin.length !== 17) {
    errors.vin = 'VIN must be exactly 17 characters';
  }

  // Mileage validation (if provided)
  if (formData.mileage.trim()) {
    const mileage = parseInt(formData.mileage);
    if (isNaN(mileage) || mileage < 0) {
      errors.mileage = 'Mileage must be a positive number';
    } else if (mileage > 500000) {
      errors.mileage = 'Mileage seems unrealistic. Please check the value';
    }
  }

  // Images validation
  if (images.length === 0) {
    errors.images = 'At least one image is required';
  }

  return errors;
};

export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

// Utility function to get error message for a specific field
export const getFieldError = (errors: ValidationErrors, field: string): string | undefined => {
  return errors[field];
};

// Clean form data before submission
export const cleanFormData = (formData: ListingFormData) => {
  return {
    ...formData,
    title: formData.title.trim(),
    description: formData.description.trim(),
    price: formData.price.trim(),
    make: formData.make.trim(),
    model: formData.model.trim(),
    year: formData.year.trim(),
    mileage: formData.mileage.trim(),
    vin: formData.vin.trim(),
    condition: formData.condition.trim(),
    city: formData.city.trim(),
    zipCode: formData.zipCode.trim()
  };
};