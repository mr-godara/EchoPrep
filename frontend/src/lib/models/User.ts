export interface IUser {
  _id: string;
  email: string;
  role: 'candidate' | 'hr';
  firstName: string;
  lastName: string;
  company?: string;
  position?: string;
} 