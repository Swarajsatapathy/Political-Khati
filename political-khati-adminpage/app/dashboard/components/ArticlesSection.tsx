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

const PAGE_SIZE = 10;
const MAX_IMAGES = 5;

type ArticleImage = {
  url: string;
  key: string;
  caption?: string;
};

type Article = {
  _id: string;
  title: string;
  content?: string;
  reporter?: string;
  district: string;
  tags?: string[];
  images?: ArticleImage[];
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

type ArticleListData = {
  articles: Article[];
  pagination: Pagination;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type FormState = {
  title: string;
  content: string;
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
  content: "",
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

export default function ArticlesSection() {
  const router = useRouter();

  const formSectionRef =
    useRef<HTMLElement>(null);

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [articles, setArticles] =
    useState<Article[]>([]);

  const [pagination, setPagination] =
    useState<Pagination>(
      initialPagination
    );

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [
    existingImages,
    setExistingImages,
  ] = useState<ArticleImage[]>([]);

  const [
    removedImageKeys,
    setRemovedImageKeys,
  ] = useState<string[]>([]);

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState<File[]>([]);

  const [
    fileInputKey,
    setFileInputKey,
  ] = useState(0);

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
  | Load Articles
  |--------------------------------------------------------------------------
  */

  const fetchArticles =
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
            `${API_URL}/api/articles/admin/all?${params.toString()}`
          );

        const result =
          await readApiResponse<ArticleListData>(
            response
          );

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load articles"
          );
        }

        setArticles(
          result.data?.articles ||
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
            : "Unable to load articles"
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
        void fetchArticles();
      }, 0);

    return () => {
      window.clearTimeout(
        timerId
      );
    };
  }, [fetchArticles]);

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
    setExistingImages([]);
    setRemovedImageKeys([]);
    setSelectedFiles([]);

    setFileInputKey(
      (currentValue) =>
        currentValue + 1
    );

    setMessage(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Image Handling
  |--------------------------------------------------------------------------
  */

  const handleFiles = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const newFiles = Array.from(
      event.target.files || []
    );

    const totalImages =
      existingImages.length +
      selectedFiles.length +
      newFiles.length;

    if (
      totalImages > MAX_IMAGES
    ) {
      setMessage({
        type: "error",
        text: `You can keep a maximum of ${MAX_IMAGES} images.`,
      });

      event.target.value = "";

      return;
    }

    setSelectedFiles(
      (currentFiles) => [
        ...currentFiles,
        ...newFiles,
      ]
    );

    event.target.value = "";
  };

  const removeSelectedFile = (
    fileIndex: number
  ) => {
    setSelectedFiles(
      (currentFiles) =>
        currentFiles.filter(
          (_, index) =>
            index !== fileIndex
        )
    );
  };

  const removeExistingImage = (
    image: ArticleImage
  ) => {
    setExistingImages(
      (currentImages) =>
        currentImages.filter(
          (existingImage) =>
            existingImage.key !==
            image.key
        )
    );

    setRemovedImageKeys(
      (currentKeys) => [
        ...new Set([
          ...currentKeys,
          image.key,
        ]),
      ]
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Create or Update Article
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
        text: "Article title is required.",
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

    if (
      existingImages.length +
        selectedFiles.length >
      MAX_IMAGES
    ) {
      setMessage({
        type: "error",
        text: `Maximum ${MAX_IMAGES} images are allowed.`,
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "title",
        form.title.trim()
      );

      formData.append(
        "content",
        form.content
      );

      formData.append(
        "reporter",
        form.reporter.trim()
      );

      formData.append(
        "district",
        form.district
      );

      formData.append(
        "tags",
        form.tags
      );

      formData.append(
        "isPublished",
        String(
          form.isPublished
        )
      );

      formData.append(
        "isFlash",
        String(form.isFlash)
      );

      selectedFiles.forEach(
        (file) => {
          formData.append(
            "images",
            file
          );
        }
      );

      if (
        editingId &&
        removedImageKeys.length >
          0
      ) {
        formData.append(
          "removeImages",
          JSON.stringify(
            removedImageKeys
          )
        );
      }

      const endpoint =
        editingId
          ? `${API_URL}/api/articles/${editingId}`
          : `${API_URL}/api/articles`;

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
        await readApiResponse<Article>(
          response
        );

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Unable to ${
              editingId
                ? "update"
                : "create"
            } article`
        );
      }

      const successText =
        result.message ||
        `Article ${
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
        await fetchArticles();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to save article",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Edit Article
  |--------------------------------------------------------------------------
  */

  const handleEdit = async (
    articleId: string
  ) => {
    setEditingLoadingId(
      articleId
    );

    setMessage(null);

    try {
      const response =
        await adminFetch(
          `${API_URL}/api/articles/admin/${articleId}`
        );

      const result =
        await readApiResponse<Article>(
          response
        );

      if (
        !response.ok ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Unable to load article"
        );
      }

      const article =
        result.data;

      setEditingId(article._id);

      setForm({
        title:
          article.title || "",
        content:
          article.content || "",
        reporter:
          article.reporter || "",
        district:
          article.district || "",
        tags: (
          article.tags || []
        ).join(", "),
        isPublished: Boolean(
          article.isPublished
        ),
        isFlash: Boolean(
          article.isFlash
        ),
      });

      setExistingImages(
        article.images || []
      );

      setRemovedImageKeys(
        []
      );

      setSelectedFiles([]);

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
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to edit article",
      });
    } finally {
      setEditingLoadingId(
        null
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Article
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (
    article: Article
  ) => {
    const shouldDelete =
      window.confirm(
        `Delete "${article.title}" permanently?`
      );

    if (!shouldDelete) {
      return;
    }

    setDeletingId(article._id);
    setListError("");

    try {
      const response =
        await adminFetch(
          `${API_URL}/api/articles/${article._id}`,
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
            "Unable to delete article"
        );
      }

      if (
        editingId === article._id
      ) {
        resetForm();
      }

      if (
        articles.length === 1 &&
        page > 1
      ) {
        setPage(
          (currentPage) =>
            currentPage - 1
        );
      } else {
        await fetchArticles();
      }
    } catch (error) {
      setListError(
        error instanceof Error
          ? error.message
          : "Unable to delete article"
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
          WEB NEWS
        </p>

        <h2>Articles</h2>

        <p>
          Create and manage Political
          Khati web news.
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
                ? "Edit Article"
                : "Create Article"}
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
              <label htmlFor="article-title">
                Article title{" "}
                <span>*</span>
              </label>

              <input
                id="article-title"
                className="adminInput"
                type="text"
                value={form.title}
                onChange={(event) =>
                  updateField(
                    "title",
                    event.target.value
                  )
                }
                placeholder="Article title"
                maxLength={300}
                required
              />
            </div>

            <div className="adminField">
              <label htmlFor="article-content">
                Article content
              </label>

              <textarea
                id="article-content"
                className="adminTextarea articleTextarea"
                value={form.content}
                onChange={(event) =>
                  updateField(
                    "content",
                    event.target.value
                  )
                }
                placeholder="Article content"
                rows={12}
              />
            </div>

            <div className="adminField">
              <label htmlFor="article-reporter">
                Reporter name
              </label>

              <input
                id="article-reporter"
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
              <label htmlFor="article-district">
                District{" "}
                <span>*</span>
              </label>

              <select
                id="article-district"
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
              <label htmlFor="article-tags">
                Tags
              </label>

              <input
                id="article-tags"
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
                politics, election,
                breaking news
              </p>
            </div>

            {existingImages.length >
              0 && (
              <div className="adminField">
                <label>
                  Existing images
                </label>

                <div className="imagePreviewGrid">
                  {existingImages.map(
                    (image) => (
                      <div
                        className="imagePreviewItem"
                        key={image.key}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={
                            image.caption ||
                            "Article"
                          }
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeExistingImage(
                              image
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="adminField">
              <label htmlFor="article-images">
                Images
              </label>

              <input
                key={fileInputKey}
                id="article-images"
                className="adminFileInput"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.avif"
                multiple
                onChange={
                  handleFiles
                }
              />

              <p className="fieldHelp">
                Optional. Maximum five
                images, up to 5 MB each.
              </p>

              {selectedFiles.length >
                0 && (
                <div className="selectedFileList">
                  {selectedFiles.map(
                    (
                      file,
                      index
                    ) => (
                      <div
                        className="selectedFileItem"
                        key={`${file.name}-${file.lastModified}-${index}`}
                      >
                        <span>
                          {file.name}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            removeSelectedFile(
                              index
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
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
                    ? "Update Article"
                    : "Create Article"}
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
              Articles (
              {pagination.total})
            </h3>

            <button
              type="button"
              className="smallSecondaryButton"
              onClick={() => {
                void fetchArticles();
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
              placeholder="Search articles"
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
              Loading articles...
            </div>
          ) : articles.length ===
            0 ? (
            <div className="emptyList">
              No articles found.
            </div>
          ) : (
            <div className="newsList">
              {articles.map(
                (article) => (
                  <div
                    className="newsListItem"
                    key={article._id}
                  >
                    {article.images?.[0]
                      ?.url && (
                      <div className="newsListThumbnail">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            article
                              .images[0]
                              .url
                          }
                          alt={
                            article.title
                          }
                        />
                      </div>
                    )}

                    <div className="newsListContent">
                      <h4>
                        {article.title}
                      </h4>

                      <p className="newsMeta">
                        {
                          article.district
                        }

                        {article.reporter
                          ? ` • ${article.reporter}`
                          : ""}

                        {" • "}

                        {formatDate(
                          article.publishedAt ||
                            article.createdAt
                        )}
                      </p>

                      <div className="badgeRow">
                        <span
                          className={
                            article.isPublished
                              ? "statusBadge published"
                              : "statusBadge draft"
                          }
                        >
                          {article.isPublished
                            ? "Published"
                            : "Draft"}
                        </span>

                        {article.isFlash && (
                          <span className="statusBadge flash">
                            Flash
                          </span>
                        )}
                      </div>

                      <div className="newsActions">
                        <button
                          type="button"
                          className="editButton"
                          onClick={() => {
                            void handleEdit(
                              article._id
                            );
                          }}
                          disabled={
                            editingLoadingId ===
                            article._id
                          }
                        >
                          {editingLoadingId ===
                          article._id
                            ? "Loading..."
                            : "Edit"}
                        </button>

                        <button
                          type="button"
                          className="deleteButton"
                          onClick={() => {
                            void handleDelete(
                              article
                            );
                          }}
                          disabled={
                            deletingId ===
                            article._id
                          }
                        >
                          {deletingId ===
                          article._id
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