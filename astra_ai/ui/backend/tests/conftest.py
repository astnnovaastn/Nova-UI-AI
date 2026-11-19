"""V34: tests never read the person's real folder grants (state/work/authorized_folders.json).

A test that needs grants passes its own file (or sets AEGIS_WORK_AUTHORIZED_FOLDERS_FILE itself)."""
import pytest


@pytest.fixture(autouse=True)
def _isolated_folder_grants(tmp_path, monkeypatch):
    monkeypatch.setenv('AEGIS_WORK_AUTHORIZED_FOLDERS_FILE', str(tmp_path / 'no-grants.json'))
