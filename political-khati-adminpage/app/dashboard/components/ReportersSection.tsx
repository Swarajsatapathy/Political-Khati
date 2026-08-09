"use client";

import { useRouter } from "next/navigation";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import DISTRICTS from "./districts";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

type ReporterPhoto = {
  url: string;
  key: string;
};

type Reporter = {
  _id: string;
  serialNumber: number;
  name: string;
  designation: string;
  district: string;
  photo?: ReporterPhoto;
  createdAt?: string;
  updatedAt?: string;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type FormState = {
  serialNumber: string;
  name: string;
  designation: string;
  district: string;
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

const initialForm: FormState = {
  serialNumber: "",
  name: "",
  designation: "",
  district: "",
};

async function readApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  const responseText = await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(
      responseText
    ) as ApiResponse<T>;
  } catch {
    return {
      message: responseText,
    };
  }
}

export default function ReportersSection() {
  const router = useRouter();

  const formSectionRef =
    useRef<HTMLElement>(null);

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [reporters, setReporters] =
    useState<Reporter[]>([]);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [
    existingPhoto,
    setExistingPhoto,
  ] = useState<ReporterPhoto | null>(
    null
  );

  const [
    selectedPhoto,
    setSelectedPhoto,
  ] = useState<File | null>(null);

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState<string>("");

  const [
    fileInputKey,
    setFileInputKey,
  ] = useState(0);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(null);

  const [message, setMessage] =
    useState<MessageState>(null);

  const [
    listError,
    setListError,
  ] = useState("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Admin Authentication Helpers
  |--------------------------------------------------------------------------
  */

  const clearAdminSession =
    useCallback(() => {
      localStorage.removeItem(
        "politicalKhatiAdminToken"
      );

      localStorage.removeItem(
        "politicalKhatiAdminUsername"
      );

      router.replace("/login");
    }, [router]);

  const adminFetch = useCallback(
    async (
      url: string,
      options: RequestInit = {}
    ) => {
      const token =
        localStorage.getItem(
          "politicalKhatiAdminToken"
        );

      if (!token) {
        clearAdminSession();

        throw new Error(
          "Please log in again"
        );
      }

      const headers = new Headers(
        options.headers
      );

      headers.set(
        "Authorization",
        `Bearer ${token}`
      );

      const response = await fetch(
        url,
        {
          ...options,
          headers,
        }
      );

      if (response.status === 401) {
        clearAdminSession();

        throw new Error(
          "Your session has expired"
        );
      }

      return response;
    },
    [clearAdminSession]
  );

  /*
  |--------------------------------------------------------------------------
  | Load Reporters
  |--------------------------------------------------------------------------
  */

  const fetchReporters =
    useCallback(async () => {
      setIsLoading(true);
      setListError("");

      try {
        const response =
          await fetch(
            `${API_URL}/api/reporters`
          );

        const result =
          await readApiResponse<Reporter[]>(
            response
          );

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load reporters"
          );
        }

        const sortedReporters = (
          result.data || []
        ).sort(
          (a, b) =>
            Number(a.serialNumber) -
            Number(b.serialNumber)
        );

        setReporters(
          sortedReporters
        );
      } catch (error) {
        setListError(
          error instanceof Error
            ? error.message
            : "Unable to load reporters"
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    const timerId =
      window.setTimeout(() => {
        void fetchReporters();
      }, 0);

    return () => {
      window.clearTimeout(
        timerId
      );
    };
  }, [fetchReporters]);

  /*
  |--------------------------------------------------------------------------
  | Photo Preview Cleanup
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl
        );
      }
    };
  }, [previewUrl]);

  /*
  |--------------------------------------------------------------------------
  | Form Helpers
  |--------------------------------------------------------------------------
  */

  const updateField = (
    field: keyof FormState,
    value: string
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const resetForm = () => {
    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    setForm(initialForm);

    setEditingId(null);

    setExistingPhoto(null);

    setSelectedPhoto(null);

    setPreviewUrl("");

    setFileInputKey(
      (currentValue) =>
        currentValue + 1
    );

    setMessage(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Photo Handling
  |--------------------------------------------------------------------------
  */

  const handlePhotoChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setMessage({
        type: "error",
        text:
          "Only JPG, PNG, WebP and AVIF images are allowed.",
      });

      event.target.value = "";

      return;
    }

    const maximumSize =
      5 * 1024 * 1024;

    if (file.size > maximumSize) {
      setMessage({
        type: "error",
        text:
          "Reporter photo must be 5 MB or smaller.",
      });

      event.target.value = "";

      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    const objectUrl =
      URL.createObjectURL(file);

    setSelectedPhoto(file);

    setPreviewUrl(objectUrl);

    setMessage(null);
  };

  const removeSelectedPhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    setSelectedPhoto(null);

    setPreviewUrl("");

    setFileInputKey(
      (currentValue) =>
        currentValue + 1
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Create or Update Reporter
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage(null);

    if (!form.serialNumber.trim()) {
      setMessage({
        type: "error",
        text:
          "Serial number is required.",
      });

      return;
    }

    const serialNumber = Number(
      form.serialNumber
    );

    if (
      !Number.isInteger(
        serialNumber
      ) ||
      serialNumber < 1
    ) {
      setMessage({
        type: "error",
        text:
          "Serial number must be a positive whole number.",
      });

      return;
    }

    if (!form.name.trim()) {
      setMessage({
        type: "error",
        text:
          "Reporter name is required.",
      });

      return;
    }

    if (
      !form.designation.trim()
    ) {
      setMessage({
        type: "error",
        text:
          "Designation is required.",
      });

      return;
    }

    if (!form.district) {
      setMessage({
        type: "error",
        text:
          "Please select a district.",
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "serialNumber",
        String(serialNumber)
      );

      formData.append(
        "name",
        form.name.trim()
      );

      formData.append(
        "designation",
        form.designation.trim()
      );

      formData.append(
        "district",
        form.district
      );

      if (selectedPhoto) {
        formData.append(
          "photo",
          selectedPhoto
        );
      }

      const endpoint =
        editingId
          ? `${API_URL}/api/reporters/${editingId}`
          : `${API_URL}/api/reporters`;

      const response =
        await adminFetch(
          endpoint,
          {
            method: editingId
              ? "PUT"
              : "POST",

            body: formData,
          }
        );

      const result =
        await readApiResponse<Reporter>(
          response
        );

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Unable to ${
              editingId
                ? "update"
                : "create"
            } reporter`
        );
      }

      const successText =
        result.message ||
        `Reporter ${
          editingId
            ? "updated"
            : "created"
        } successfully`;

      resetForm();

      setMessage({
        type: "success",
        text: successText,
      });

      await fetchReporters();
    } catch (error) {
      setMessage({
        type: "error",

        text:
          error instanceof Error
            ? error.message
            : "Unable to save reporter",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Edit Reporter
  |--------------------------------------------------------------------------
  */

  const handleEdit = (
    reporter: Reporter
  ) => {
    setMessage(null);

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    setEditingId(
      reporter._id
    );

    setForm({
      serialNumber: String(
        reporter.serialNumber || ""
      ),

      name:
        reporter.name || "",

      designation:
        reporter.designation || "",

      district:
        reporter.district || "",
    });

    setExistingPhoto(
      reporter.photo?.url
        ? reporter.photo
        : null
    );

    setSelectedPhoto(null);

    setPreviewUrl("");

    setFileInputKey(
      (currentValue) =>
        currentValue + 1
    );

    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView(
        {
          behavior: "smooth",
          block: "start",
        }
      );
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Reporter
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (
    reporter: Reporter
  ) => {
    const shouldDelete =
      window.confirm(
        `Delete "${reporter.name}" permanently?`
      );

    if (!shouldDelete) {
      return;
    }

    setDeletingId(
      reporter._id
    );

    setListError("");

    try {
      const response =
        await adminFetch(
          `${API_URL}/api/reporters/${reporter._id}`,
          {
            method: "DELETE",
          }
        );

      const result =
        await readApiResponse<null>(
          response
        );

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to delete reporter"
        );
      }

      if (
        editingId ===
        reporter._id
      ) {
        resetForm();
      }

      await fetchReporters();
    } catch (error) {
      setListError(
        error instanceof Error
          ? error.message
          : "Unable to delete reporter"
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const handleSearch = (
    event: FormEvent
  ) => {
    event.preventDefault();

    setSearch(
      searchInput
        .trim()
        .toLowerCase()
    );
  };

  const filteredReporters =
    search
      ? reporters.filter(
          (reporter) => {
            const searchableText =
              [
                reporter.serialNumber,
                reporter.name,
                reporter.designation,
                reporter.district,
              ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(
              search
            );
          }
        )
      : reporters;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <section className="dashboardSection">
      <div className="sectionHeading">
        <p className="sectionEyebrow">
          REPORTERS
        </p>

        <h2>Reporters</h2>

        <p>
          Create and manage Political
          Khati reporters.
        </p>
      </div>

      <div className="dashboardColumns">
        {/* --------------------------------------------------------------- */}
        {/* Create / Edit Reporter                                           */}
        {/* --------------------------------------------------------------- */}

        <article
          className="dashboardCard"
          ref={formSectionRef}
        >
          <div className="cardHeadingRow">
            <h3>
              {editingId
                ? "Edit Reporter"
                : "Add Reporter"}
            </h3>

            {editingId && (
              <button
                type="button"
                className="smallSecondaryButton"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form
            className="adminForm"
            onSubmit={handleSubmit}
          >
            {/* Serial Number */}

            <div className="adminField">
              <label htmlFor="reporter-serial-number">
                Serial Number{" "}
                <span>*</span>
              </label>

              <input
                id="reporter-serial-number"
                className="adminInput"
                type="number"
                min="1"
                step="1"
                value={
                  form.serialNumber
                }
                onChange={(event) =>
                  updateField(
                    "serialNumber",
                    event.target.value
                  )
                }
                placeholder="Example: 1"
                required
              />
            </div>

            {/* Name */}

            <div className="adminField">
              <label htmlFor="reporter-name">
                Reporter Name{" "}
                <span>*</span>
              </label>

              <input
                id="reporter-name"
                className="adminInput"
                type="text"
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                placeholder="Reporter name"
                maxLength={150}
                required
              />
            </div>

            {/* Designation */}

            <div className="adminField">
              <label htmlFor="reporter-designation">
                Designation{" "}
                <span>*</span>
              </label>

              <input
                id="reporter-designation"
                className="adminInput"
                type="text"
                value={
                  form.designation
                }
                onChange={(event) =>
                  updateField(
                    "designation",
                    event.target.value
                  )
                }
                placeholder="Example: District Reporter"
                maxLength={150}
                required
              />
            </div>

            {/* District */}

            <div className="adminField">
              <label htmlFor="reporter-district">
                District{" "}
                <span>*</span>
              </label>

              <select
                id="reporter-district"
                className="adminSelect"
                value={
                  form.district
                }
                onChange={(event) =>
                  updateField(
                    "district",
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select District
                </option>

                {DISTRICTS.map(
                  (district) => (
                    <option
                      value={district}
                      key={district}
                    >
                      {district}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Existing Photo */}

            {existingPhoto?.url &&
              !selectedPhoto && (
                <div className="adminField">
                  <label>
                    Current Photo
                  </label>

                  <div className="imagePreviewGrid">
                    <div className="imagePreviewItem">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          existingPhoto.url
                        }
                        alt="Reporter"
                      />
                    </div>
                  </div>

                  <p className="fieldHelp">
                    Upload a new photo
                    below to replace this
                    photo.
                  </p>
                </div>
              )}

            {/* Photo */}

            <div className="adminField">
              <label htmlFor="reporter-photo">
                Reporter Photo
              </label>

              <input
                key={fileInputKey}
                id="reporter-photo"
                className="adminFileInput"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.avif"
                onChange={
                  handlePhotoChange
                }
              />

              <p className="fieldHelp">
                Optional. JPG, PNG,
                WebP or AVIF. Maximum
                5 MB.
              </p>

              {selectedPhoto &&
                previewUrl && (
                  <div className="imagePreviewGrid">
                    <div className="imagePreviewItem">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="Selected reporter"
                      />

                      <button
                        type="button"
                        onClick={
                          removeSelectedPhoto
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
            </div>

            {/* Message */}

            {message && (
              <div
                className={`formMessage ${message.type}`}
                role="alert"
              >
                {message.text}
              </div>
            )}

            {/* Buttons */}

            <div className="formActions">
              <button
                type="submit"
                className="primaryButton formSubmitButton"
                disabled={
                  isSubmitting
                }
              >
                {isSubmitting
                  ? "Saving..."
                  : editingId
                    ? "Update Reporter"
                    : "Add Reporter"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondaryButton"
                  onClick={
                    resetForm
                  }
                  disabled={
                    isSubmitting
                  }
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </article>

        {/* --------------------------------------------------------------- */}
        {/* Reporter List                                                    */}
        {/* --------------------------------------------------------------- */}

        <article className="dashboardCard newsListCard">
          <div className="cardHeadingRow">
            <h3>
              Reporters (
              {reporters.length})
            </h3>

            <button
              type="button"
              className="smallSecondaryButton"
              onClick={() => {
                void fetchReporters();
              }}
              disabled={isLoading}
            >
              Refresh
            </button>
          </div>

          {/* Search */}

          <form
            className="listSearchForm"
            onSubmit={handleSearch}
          >
            <input
              className="adminInput"
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Search reporters"
            />

            <button
              type="submit"
              className="secondaryButton"
            >
              Search
            </button>

            {search && (
              <button
                type="button"
                className="smallSecondaryButton"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
              >
                Clear
              </button>
            )}
          </form>

          {/* Error */}

          {listError && (
            <div className="formMessage error">
              {listError}
            </div>
          )}

          {/* List */}

          {isLoading ? (
            <div className="listLoading">
              Loading reporters...
            </div>
          ) : filteredReporters.length ===
            0 ? (
            <div className="emptyList">
              {search
                ? "No matching reporters found."
                : "No reporters found."}
            </div>
          ) : (
            <div className="newsList">
              {filteredReporters.map(
                (reporter) => (
                  <div
                    className="newsListItem"
                    key={reporter._id}
                  >
                    {/* Reporter Photo */}

                    {reporter.photo
                      ?.url && (
                      <div className="newsListThumbnail">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            reporter
                              .photo.url
                          }
                          alt={
                            reporter.name
                          }
                        />
                      </div>
                    )}

                    {/* Reporter Information */}

                    <div className="newsListContent">
                      <h4>
                        {reporter.serialNumber}
                        .{" "}
                        {reporter.name}
                      </h4>

                      <p className="newsMeta">
                        {
                          reporter.designation
                        }

                        {" • "}

                        {
                          reporter.district
                        }
                      </p>

                      <div className="badgeRow">
                        <span className="statusBadge published">
                          Serial No.{" "}
                          {
                            reporter.serialNumber
                          }
                        </span>
                      </div>

                      {/* Actions */}

                      <div className="newsActions">
                        <button
                          type="button"
                          className="editButton"
                          onClick={() =>
                            handleEdit(
                              reporter
                            )
                          }
                          disabled={
                            deletingId ===
                            reporter._id
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="deleteButton"
                          onClick={() => {
                            void handleDelete(
                              reporter
                            );
                          }}
                          disabled={
                            deletingId ===
                            reporter._id
                          }
                        >
                          {deletingId ===
                          reporter._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}