import { useState } from 'react';
import apiClient from '../api/apiClient';

export const useRideSearch = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutateAsync = async (searchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: responseData } = await apiClient.post('/rides/search', searchParams);
      setData(responseData.data);
      setIsLoading(false);
      return responseData.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Search failed';
      setError(errMsg);
      setIsLoading(false);
      throw new Error(errMsg);
    }
  };

  return { 
    data, 
    isLoading, 
    error, 
    mutateAsync 
  };
};

export default useRideSearch;
