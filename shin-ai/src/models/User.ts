import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  avatar?: string;
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled';
    expiresAt?: Date;
  };
  organizations: mongoose.Types.ObjectId[];
  defaultOrganization?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  avatar: {
    type: String,
    default: null,
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled'],
      default: 'active',
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  organizations: [{
    type: Schema.Types.ObjectId,
    ref: 'Organization',
  }],
  defaultOrganization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
  },
}, {
  timestamps: true,
});

// Index for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ 'subscription.plan': 1 });
UserSchema.index({ organizations: 1 });
UserSchema.index({ defaultOrganization: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
