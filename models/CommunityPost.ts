import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommunityComment {
  _id: mongoose.Types.ObjectId;
  authorId: string;
  author: string;
  content: string;
  createdAt: Date;
}

export interface ICommunityPost extends Document {
  authorId: string;
  author: string;
  profileImage?: string;
  content: string;
  images: string[];
  status: "pending" | "approved" | "hidden";
  featured: boolean;
  likes: string[];
  comments: ICommunityComment[];
  createdAt: Date;
  updatedAt: Date;
}

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    authorId: { type: String, required: true, index: true },
    author: { type: String, required: true, trim: true },
    profileImage: { type: String, default: "" },
    content: { type: String, required: true, trim: true, maxlength: 1200 },
    images: { type: [String], default: [] },
    status: { type: String, enum: ["pending", "approved", "hidden"], default: "approved", index: true },
    featured: { type: Boolean, default: false },
    likes: { type: [String], default: [] },
    comments: {
      type: [{
        authorId: { type: String, required: true },
        author: { type: String, required: true },
        content: { type: String, required: true, trim: true, maxlength: 500 },
      }],
      default: [],
    },
  },
  { timestamps: true }
);

const CommunityPost: Model<ICommunityPost> = mongoose.models.CommunityPost || mongoose.model<ICommunityPost>("CommunityPost", CommunityPostSchema);
export default CommunityPost;
