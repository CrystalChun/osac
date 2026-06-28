import { createContext, useContext } from 'react';

const FieldValidationContext = createContext(false);

export const FieldValidationProvider = FieldValidationContext.Provider;

export const useShowFieldValidationErrors = (): boolean => useContext(FieldValidationContext);
