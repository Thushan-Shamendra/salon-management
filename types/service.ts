export interface ServiceItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  image?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServicesApiResponse {
  success: boolean;
  services?: ServiceItem[];
  message?: string;
}
