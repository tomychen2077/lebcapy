import { useState, ChangeEvent, FormEvent } from 'react';

type FieldValues = Record<string, any>;
type FieldErrors<T> = Partial<Record<keyof T, string>>;
type Validator<T> = (values: T) => FieldErrors<T>;

interface UseFormOptions<T extends FieldValues> {
  initialValues: T;
  onSubmit: (values: T, formHelpers: { resetForm: () => void }) => void | Promise<void>;
  validate?: Validator<T>;
}

export function useForm<T extends FieldValues>({
  initialValues,
  onSubmit,
  validate,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : value;

    setValues(prev => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error when field is changed
    if (errors[name as keyof T]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    // Validate field on blur if validate function is provided
    if (validate) {
      const validationErrors = validate(values);
      setErrors(prev => ({
        ...prev,
        ...validationErrors,
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    setSubmitCount(prev => prev + 1);
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched(allTouched as Partial<Record<keyof T, boolean>>);

    // Validate all fields if validate function is provided
    let validationErrors = {};
    if (validate) {
      validationErrors = validate(values);
      setErrors(validationErrors);

      // Don't submit if there are errors
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(values, {
        resetForm,
      });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setFieldValue = (name: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const setFieldError = (name: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitCount,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
  };
}