import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import { Link } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import { PageHeader, ListGroup, ListGroupItem } from "react-bootstrap";
import { useAppContext } from "../libs/contextLib";
import { onError } from "../libs/errorLib";
import Select from 'react-select';
import LoaderButton from "../components/LoaderButton";
import { useHistory } from "react-router-dom";

import { FormGroup, FormControl } from "react-bootstrap";

import "./Home.css";


export default function Home() {
  const [team, setTeamName] = useState("");
  const [notes, setNotes] = useState([]);
  const [teams, setTeams] = useState([]);
  const { isAuthenticated } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const history = useHistory();

  useEffect(() => {
    async function onLoad() {
      if (!isAuthenticated) {
        return;
      }

      try {
        const notes = await loadNotes();
        const teams = await loadTeams();
        setNotes(notes);
        setTeams(teams)
      } catch (e) {
        onError(e);
      }
      setIsLoadingTeams(false)
      setIsLoading(false);
    }

    onLoad();
  }, [isAuthenticated]);

  function loadNotes() {
    return []
    // return API.get("notes", "/list");
  }

  function loadTeams() {
    return API.get("team", "");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);

    try {

      await createTeam({ team });
      history.push("/");
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  function createTeam(team) {
    return API.post("team", "", {
      body: {
        'teamName': team.team,
      }
    });
  }

  function renderNotesList(notes) {
    return [{}].concat(notes).map((note, i) =>
      i !== 0 ? (
        <LinkContainer key={note.noteId} to={`/notes/${note.id}`}>
          <ListGroupItem header={note.data.trim().split("\n")[0]}>
          </ListGroupItem>
        </LinkContainer>
      ) : (
          <LinkContainer key="new" to="/notes/new">
            <ListGroupItem>
              <h4>
                <b>{"\uFF0B"}</b> Create a new note
            </h4>
            </ListGroupItem>
          </LinkContainer>
        )
    );
  }

  function renderLander() {
    return (
      <div className="lander">
        <h1>MyApp</h1>
        <p>A simple note creating app with a serverless backend</p>
        <div>
          <Link to="/login" className="btn btn-info btn-lg">
            Login
          </Link>
          <Link to="/signup" className="btn btn-success btn-lg">
            Signup
          </Link>
        </div>
      </div>
    );
  }

  function renderNotes() {
    return (
      <div className="notes">
        <PageHeader>Your Teams</PageHeader>
        {!isLoadingTeams &&
          <Select options={
            teams.map(t => ({value: t.teamId, label: t.teamName}))
          } />}
        <div>
          <form onSubmit={handleSubmit}>
            <FormGroup controlId="content">
              <FormControl
                value={team}
                onChange={e => setTeamName(e.target.value)}
              />
            </FormGroup>
            <LoaderButton
              block
              type="submit"
              bsSize="small"
              bsStyle="primary"
              isLoading={isLoading}
            >
              Create Team
        </LoaderButton>
          </form>
        </div>
        <PageHeader>Your Notes</PageHeader>
        <ListGroup>
          {!isLoading && renderNotesList(notes)}
        </ListGroup>
      </div>
    );
  }

  return (
    <div className="Home">
      {isAuthenticated ? renderNotes() : renderLander()}
    </div>
  );
}
