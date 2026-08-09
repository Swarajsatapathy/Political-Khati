import Reporter from "../models/Reporter.js";

import {
  uploadToS3,
  deleteFromS3,
} from "../utils/s3Upload.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

/* -------------------------------------------------------------------------- */
/* Create Reporter                                                            */
/* -------------------------------------------------------------------------- */

const createReporter = asyncHandler(async (req, res) => {
  const {
    serialNumber,
    name,
    designation,
    district,
  } = req.body;

  if (!serialNumber || !name || !designation || !district) {
    throw new ApiError(
      400,
      "Serial number, name, designation and district are required",
    );
  }

  let photo = {
    url: "",
    key: "",
  };

  if (req.file) {
    const uploadedPhoto = await uploadToS3(
      req.file.buffer,
      req.file.mimetype,
      "reporters",
    );

    photo = {
      url: uploadedPhoto.url,
      key: uploadedPhoto.key,
    };
  }

  const reporter = await Reporter.create({
    serialNumber: Number(serialNumber),
    name: name.trim(),
    designation: designation.trim(),
    district: district.trim(),
    photo,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        reporter,
        "Reporter created successfully",
      ),
    );
});

/* -------------------------------------------------------------------------- */
/* Get All Reporters                                                          */
/* -------------------------------------------------------------------------- */

const getReporters = asyncHandler(async (req, res) => {
  const reporters = await Reporter.find()
    .sort({
      serialNumber: 1,
      createdAt: 1,
    })
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        reporters,
        "Reporters fetched successfully",
      ),
    );
});

/* -------------------------------------------------------------------------- */
/* Get Reporter By ID                                                         */
/* -------------------------------------------------------------------------- */

const getReporterById = asyncHandler(async (req, res) => {
  const reporter = await Reporter.findById(req.params.id);

  if (!reporter) {
    throw new ApiError(404, "Reporter not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        reporter,
        "Reporter fetched successfully",
      ),
    );
});

/* -------------------------------------------------------------------------- */
/* Update Reporter                                                            */
/* -------------------------------------------------------------------------- */

const updateReporter = asyncHandler(async (req, res) => {
  const reporter = await Reporter.findById(req.params.id);

  if (!reporter) {
    throw new ApiError(404, "Reporter not found");
  }

  const {
    serialNumber,
    name,
    designation,
    district,
  } = req.body;

  if (serialNumber !== undefined) {
    reporter.serialNumber = Number(serialNumber);
  }

  if (name !== undefined) {
    reporter.name = name.trim();
  }

  if (designation !== undefined) {
    reporter.designation = designation.trim();
  }

  if (district !== undefined) {
    reporter.district = district.trim();
  }

  if (req.file) {
    if (reporter.photo?.key) {
      await deleteFromS3(reporter.photo.key);
    }

    const uploadedPhoto = await uploadToS3(
      req.file.buffer,
      req.file.mimetype,
      "reporters",
    );

    reporter.photo = {
      url: uploadedPhoto.url,
      key: uploadedPhoto.key,
    };
  }

  await reporter.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        reporter,
        "Reporter updated successfully",
      ),
    );
});

/* -------------------------------------------------------------------------- */
/* Delete Reporter                                                            */
/* -------------------------------------------------------------------------- */

const deleteReporter = asyncHandler(async (req, res) => {
  const reporter = await Reporter.findById(req.params.id);

  if (!reporter) {
    throw new ApiError(404, "Reporter not found");
  }

  if (reporter.photo?.key) {
    await deleteFromS3(reporter.photo.key);
  }

  await reporter.deleteOne();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Reporter deleted successfully",
      ),
    );
});

export {
  createReporter,
  getReporters,
  getReporterById,
  updateReporter,
  deleteReporter,
};