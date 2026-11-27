export type BookingStatus =
  "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

export type BookingScope = "upcoming" | "past" | "cancelled" | "all";

export type BookingPeriod = "today" | "tomorrow" | "this-week";

export type Booking = {
  id: string;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  serviceName: string;
  serviceDurationMinutes: number;
  priceAmount: string;
  currencyCode: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type BookingListResponse = {
  data: {
    bookings: Booking[];
    pagination: Pagination;
    timeZone: string;
  };
};

export type BookingErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type BookingFilters = {
  status: BookingStatus | "";
  from: string;
  to: string;
};

export type BookingDetailsCustomer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

export type BookingDetails = Omit<Booking, "customer"> & {
  customer: BookingDetailsCustomer;
};

export type BookingDetailsResponse = {
  data: {
    booking: BookingDetails;
    timeZone: string;
  };
};

export type BookingUpdateResponse = {
  data: {
    booking: BookingDetails;
  };
};

export type BookingDetailsErrorResponse = {
  error?: {
    message?: string;
    issues?: {
      path: (string | number)[];
      message: string;
    }[];
  };
};

export type BookingUpdatePayload = {
  customerId?: string;
  startsAt?: string;
};

export type BookingCustomerOption = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

export type BookingServiceOption = {
  id: string;
  name: string;
  durationMinutes: number;
  priceAmount: string;
  currencyCode: string;
};

export type BookingCustomersResponse = {
  data: {
    customers: BookingCustomerOption[];
  };
};

export type BookingServicesResponse = {
  data: {
    services: BookingServiceOption[];
  };
};

export type CreateBookingPayload = {
  customerId: string;
  serviceId: string;
  startsAt: string;
};
