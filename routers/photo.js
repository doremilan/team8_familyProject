const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const {
  postPhoto,
  getPhotos,
  getPhotoDetail,
  putPhoto,
  deletePhoto,
} = require("../controllers/photoController");

// 사진 목록조회(무한스크롤 적용)
router.get("/:photoAlbumId/:pageNum", authMiddleware, getPhotos);

// 사진 상세조회
router.get("/:familyId/detail/:photoId", authMiddleware, getPhotoDetail);

// 사진수정
router.put("/:photoId", upload.single("photoFile"), authMiddleware, putPhoto);

// 사진삭제
router.delete("/:photoId", authMiddleware, deletePhoto);

// 사진생성
router.post(
  "/:familyId/:photoAlbumId",
  upload.single("photoFile"),
  authMiddleware,
  postPhoto
);

module.exports = router;
