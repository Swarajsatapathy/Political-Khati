import mongoose from "mongoose";

const reporterSchema = new mongoose.Schema(
  {
    serialNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
    },

    district: {
      type: String,
      required: true,
      trim: true,
    },

    photo: {
      url: {
        type: String,
        default: "",
      },

      key: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  },
);

reporterSchema.index({ serialNumber: 1 });

const Reporter = mongoose.model("Reporter", reporterSchema);

export default Reporter;