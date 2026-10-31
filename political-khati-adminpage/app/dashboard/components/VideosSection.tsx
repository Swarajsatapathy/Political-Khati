"use client";

import { useRouter } from "next/navigation";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import DISTRICTS from "./districts";
import {
  clearAdminSession as clearAuthSession,
  getAdminToken,
  recordActivity,
} from "../../lib/auth";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const PAGE_SIZE = 10;

type Video = {
  _id: string;
  title: string;
  youtubeUrl: string;
  youtubeVideoId?: string;
  thumbnail?: string;
  reporter?: string;
  district: string;
  description?: string;
  tags?: string[];
  isPublished: boolean;
  isFlash: boolean;
  createdAt?: string;
  publishedAt?: string | null;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type VideoListData = {
  videos: Video[];
  pagination: Pagination;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type FormState = {
  title: string;
  description: string;
  youtubeUrl: string;
  reporter: string;
  district: string;
  tags: string;
  isPublished: boolean;
  isFlash: boolean;
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

const initialForm: FormState = {
  title: "",
  description: "",
  youtubeUrl: "",
  reporter: "",
  district: "",
  tags: "",
  isPublished: true,
  isFlash: false,
};

const initialPagination: Pagination = {
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

async function readApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  const responseText =
    await response.text();

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

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Not published";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

export default function VideosSection() {
  const router = useRouter();

  const formSectionRef =
    useRef<HTMLElement>(null);

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [videos, setVideos] =
    useState<Video[]>([]);

  const [pagination, setPagination] =
    useState<Pagination>(
      initialPagination
    );

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [page, setPage] =
    useState(1);

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    editingLoadingId,
    setEditingLoadingId,
  ] = useState<string | null>(
    null
  );

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(
    null
  );

  const [message, setMessage] =
    useState<MessageState>(null);

  const [
    listError,
    setListError,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Admin Authentication
  |--------------------------------------------------------------------------
  */

  const clearAdminSession =
    useCallback(() => {
      clearAuthSession();

      router.replace("/login");
    }, [router]);

  const adminFetch = useCallback(
    async (
      url: string,
      options: RequestInit = {}
    ) => {
      const token = getAdminToken();

      if (token) {
        recordActivity();
      }

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

      if (
        response.status === 401
      ) {
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
  | Load Video News
  |--------------------------------------------------------------------------
  */

  const fetchVideos =
    useCallback(async () => {
      setIsLoading(true);
      setListError("");

      try {
        const params =
          new URLSearchParams({
            page: String(page),
            limit: String(
              PAGE_SIZE
            ),
            sortBy: "createdAt",
            order: "desc",
          });

        if (search) {
          params.set(
            "search",
            search
          );
        }

        const response =
          await adminFetch(
            `${API_URL}/api/videos/admin/all?${params.toString()}`
          );

        const result =
          await readApiResponse<VideoListData>(
            response
          );

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load videos"
          );
        }

        setVideos(
          result.data?.videos ||
            []
        );

        setPagination(
          result.data?.pagination ||
            initialPagination
        );
      } catch (error) {
        setListError(
          error instanceof Error
            ? error.message
            : "Unable to load videos"
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      adminFetch,
      page,
      search,
    ]);

  useEffect(() => {
    const timerId =
      window.setTimeout(() => {
        void fetchVideos();
      }, 0);

    return () => {
      window.clearTimeout(
        timerId
      );
    };
  }, [fetchVideos]);

  /*
  |--------------------------------------------------------------------------
  | Form Helpers
  |--------------------------------------------------------------------------
  */

  const updateField = (
    field: keyof FormState,
    value: string | boolean
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setMessage(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Create or Update Video
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setMessage(null);

    if (!form.title.trim()) {
      setMessage({
        type: "error",
        text: "Video title is required.",
      });

      return;
    }

    if (
      !form.youtubeUrl.trim()
    ) {
      setMessage({
        type: "error",
        text: "YouTube URL is required.",
      });

      return;
    }

    if (!form.district) {
      setMessage({
        type: "error",
        text: "Please select a district.",
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody = {
        title:
          form.title.trim(),

        description:
          form.description.trim(),

        youtubeUrl:
          form.youtubeUrl.trim(),

        reporter:
          form.reporter.trim(),

        district:
          form.district,

        tags: form.tags,

        isPublished:
          form.isPublished,

        isFlash:
          form.isFlash,
      };

      const endpoint =
        editingId
          ? `${API_URL}/api/videos/${editingId}`
          : `${API_URL}/api/videos`;

      const response =
        await adminFetch(
          endpoint,
          {
            method: editingId
              ? "PUT"
              : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              requestBody
            ),
          }
        );

      const result =
        await readApiResponse<Video>(
          response
        );

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Unable to ${
              editingId
                ? "update"
                : "create"
            } video`
        );
      }

      const successText =
        result.message ||
        `Video ${
          editingId
            ? "updated"
            : "created"
        } successfully`;

      resetForm();

      setMessage({
        type: "success",
        text: successText,
      });

      if (page !== 1) {
        setPage(1);
      } else {
        await fetchVideos();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to save video",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Edit Video
  |--------------------------------------------------------------------------
  */

  const handleEdit = async (
    videoId: string
  ) => {
    setEditingLoadingId(
      videoId
    );

    setMessage(null);

    try {
      const response =
        await adminFetch(
          `${API_URL}/api/videos/admin/${videoId}`
        );

      const result =
        await readApiResponse<Video>(
          response
        );

      if (
        !response.ok ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Unable to load video"
        );
      }

      const video =
        result.data;

      setEditingId(video._id);

      setForm({
        title:
          video.title || "",

        description:
          video.description || "",

        youtubeUrl:
          video.youtubeUrl || "",

        reporter:
          video.reporter || "",

        district:
          video.district || "",

        tags: (
          video.tags || []
        ).join(", "),

        isPublished: Boolean(
          video.isPublished
        ),

        isFlash: Boolean(
          video.isFlash
        ),
      });

      requestAnimationFrame(() => {
        formSectionRef.current?.scrollIntoView(
          {
            behavior: "smooth",
            block: "start",
          }
        );
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to edit video",
      });
    } finally {
      setEditingLoadingId(
        null
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Video
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (
    video: Video
  ) => {
    const shouldDelete =
      window.confirm(
        `Delete "${video.title}" permanently?`
      );

    if (!shouldDelete) {
      return;
    }

    setDeletingId(video._id);
    setListError("");

    try {
      const response =
        await adminFetch(
          `${API_URL}/api/videos/${video._id}`,
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
            "Unable to delete video"
        );
      }

      if (
        editingId === video._id
      ) {
        resetForm();
      }

      if (
        videos.length === 1 &&
        page > 1
      ) {
        setPage(
          (currentPage) =>
            currentPage - 1
        );
      } else {
        await fetchVideos();
      }
    } catch (error) {
      setListError(
        error instanceof Error
          ? error.message
          : "Unable to delete video"
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

    setPage(1);

    setSearch(
      searchInput.trim()
    );
  };

  return (
    <section className="dashboardSection">
      <div className="sectionHeading">
        <p className="sectionEyebrow">
          VIDEO NEWS
        </p>

        <h2>Video News</h2>

        <p>
          Create and manage Political
          Khati video news.
        </p>
      </div>

      <div className="dashboardColumns">
        <article
          className="dashboardCard"
          ref={formSectionRef}
        >
          <div className="cardHeadingRow">
            <h3>
              {editingId
                ? "Edit Video News"
                : "Create Video News"}
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
            <div className="adminField">
              <label htmlFor="video-title">
                Video title{" "}
                <span>*</span>
              </label>

              <input
                id="video-title"
                className="adminInput"
                type="text"
                value={form.title}
                onChange={(event) =>
                  updateField(
                    "title",
                    event.target.value
                  )
                }
                placeholder="Video title"
                maxLength={300}
                required
              />
            </div>

            <div className="adminField">
              <label htmlFor="video-description">
                Video description
              </label>

              <textarea
                id="video-description"
                className="adminTextarea videoDescriptionTextarea"
                value={
                  form.description
                }
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Video description"
                rows={7}
                maxLength={500}
              />
            </div>

            <div className="adminField">
              <label htmlFor="youtube-url">
                YouTube URL{" "}
                <span>*</span>
              </label>

              <input
                id="youtube-url"
                className="adminInput"
                type="url"
                value={
                  form.youtubeUrl
                }
                onChange={(event) =>
                  updateField(
                    "youtubeUrl",
                    event.target.value
                  )
                }
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
            </div>

            <div className="adminField">
              <label htmlFor="video-reporter">
                Reporter name
              </label>

              <input
                id="video-reporter"
                className="adminInput"
                type="text"
                value={form.reporter}
                onChange={(event) =>
                  updateField(
                    "reporter",
                    event.target.value
                  )
                }
                placeholder="Reporter name (optional)"
                maxLength={150}
              />
            </div>

            <div className="adminField">
              <label htmlFor="video-district">
                District{" "}
                <span>*</span>
              </label>

              <select
                id="video-district"
                className="adminSelect"
                value={form.district}
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

            <div className="adminField">
              <label htmlFor="video-tags">
                Tags
              </label>

              <input
                id="video-tags"
                className="adminInput"
                type="text"
                value={form.tags}
                onChange={(event) =>
                  updateField(
                    "tags",
                    event.target.value
                  )
                }
                placeholder="Tags comma separated"
              />

              <p className="fieldHelp">
                Example: Odisha
                politics, interview,
                breaking news
              </p>
            </div>

            <div className="checkboxGrid">
              <label className="checkboxOption">
                <input
                  type="checkbox"
                  checked={
                    form.isPublished
                  }
                  onChange={(event) =>
                    updateField(
                      "isPublished",
                      event.target
                        .checked
                    )
                  }
                />

                <span>
                  Published
                </span>
              </label>

              <label className="checkboxOption">
                <input
                  type="checkbox"
                  checked={
                    form.isFlash
                  }
                  onChange={(event) =>
                    updateField(
                      "isFlash",
                      event.target
                        .checked
                    )
                  }
                />

                <span>Flash</span>
              </label>
            </div>

            {message && (
              <div
                className={`formMessage ${message.type}`}
                role="alert"
              >
                {message.text}
              </div>
            )}

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
                    ? "Update Video"
                    : "Create Video"}
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

        <article className="dashboardCard newsListCard">
          <div className="cardHeadingRow">
            <h3>
              Video News (
              {pagination.total})
            </h3>

            <button
              type="button"
              className="smallSecondaryButton"
              onClick={() => {
                void fetchVideos();
              }}
              disabled={isLoading}
            >
              Refresh
            </button>
          </div>

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
              placeholder="Search video news"
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
                  setPage(1);
                }}
              >
                Clear
              </button>
            )}
          </form>

          {listError && (
            <div className="formMessage error">
              {listError}
            </div>
          )}

          {isLoading ? (
            <div className="listLoading">
              Loading video news...
            </div>
          ) : videos.length ===
            0 ? (
            <div className="emptyList">
              No video news found.
            </div>
          ) : (
            <div className="newsList">
              {videos.map(
                (video) => (
                  <div
                    className={`newsListItem ${
                      editingId === video._id
                        ? "isEditing"
                        : ""
                    }`}
                    key={video._id}
                  >
                    {video.thumbnail && (
                      <div className="newsListThumbnail videoThumbnail">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            video.thumbnail
                          }
                          alt={
                            video.title
                          }
                        />
                      </div>
                    )}

                    <div className="newsListContent">
                      <h4>
                        {video.title}
                      </h4>

                      <p className="newsMeta">
                        {
                          video.district
                        }

                        {video.reporter
                          ? ` • ${video.reporter}`
                          : ""}

                        {" • "}

                        {formatDate(
                          video.publishedAt ||
                            video.createdAt
                        )}
                      </p>

                      <div className="badgeRow">
                        <span
                          className={
                            video.isPublished
                              ? "statusBadge published"
                              : "statusBadge draft"
                          }
                        >
                          {video.isPublished
                            ? "Published"
                            : "Draft"}
                        </span>

                        {video.isFlash && (
                          <span className="statusBadge flash">
                            Flash
                          </span>
                        )}

                        {editingId === video._id && (
                          <span className="statusBadge editing">
                            Editing Now
                          </span>
                        )}
                      </div>

                      <div className="newsActions">
                        <button
                          type="button"
                          className="editButton"
                          onClick={() => {
                            void handleEdit(
                              video._id
                            );
                          }}
                          disabled={
                            editingLoadingId ===
                            video._id
                          }
                          title="Edit video news"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          <span>
                            {editingLoadingId ===
                            video._id
                              ? "Loading..."
                              : "Edit"}
                          </span>
                        </button>

                        <button
                          type="button"
                          className="deleteButton"
                          onClick={() => {
                            void handleDelete(
                              video
                            );
                          }}
                          disabled={
                            deletingId ===
                            video._id
                          }
                          title="Delete video news"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          <span>
                            {deletingId ===
                            video._id
                              ? "Deleting..."
                              : "Delete"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {pagination.totalPages >
            1 && (
            <div className="pagination">
              <button
                type="button"
                className="smallSecondaryButton"
                disabled={
                  !pagination.hasPreviousPage
                }
                onClick={() =>
                  setPage(
                    (currentPage) =>
                      Math.max(
                        1,
                        currentPage -
                          1
                      )
                  )
                }
              >
                Previous
              </button>

              <span>
                Page{" "}
                {pagination.page} of{" "}
                {
                  pagination.totalPages
                }
              </span>

              <button
                type="button"
                className="smallSecondaryButton"
                disabled={
                  !pagination.hasNextPage
                }
                onClick={() =>
                  setPage(
                    (currentPage) =>
                      currentPage +
                      1
                  )
                }
              >
                Next
              </button>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}