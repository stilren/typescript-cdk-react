import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import { useParams, useHistory } from "react-router-dom";
import { FormGroup, FormControl } from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import { onError } from "../libs/errorLib";
import "./Notes.css";

export default function Notes() {
  const { id } = useParams();
  const history = useHistory();
  const [note, setNote] = useState(null);
  const [content, setContent] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadNote() {
        return API.get("notes", "/read", {
            'queryStringParameters': {
              'noteid': id,
            }
          });
    }

    async function onLoad() {
      try {
        const note = await loadNote();
        setContent(note.data);
        setNote(note);
      } catch (e) {
        onError(e);
      }
    }

    onLoad();
  }, [id]);

  function deleteNote() {
    API.del("notes", "/delete", {
        'queryStringParameters': {
          'noteid': id,
        }
      });
  }

  async function handleDelete(event) {
    event.preventDefault();

    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteNote();
      history.push("/");
    } catch (e) {
      onError(e);
      setIsDeleting(false);
    }
  }

  return (
    <div className="Notes">
      {note && (
        <form>
          <FormGroup controlId="content">
            <FormControl
              value={content}
              componentClass="textarea"
              readOnly
            />
          </FormGroup>
          <LoaderButton
            block
            bsSize="large"
            bsStyle="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Delete
          </LoaderButton>
        </form>
      )}
    </div>
  );
}