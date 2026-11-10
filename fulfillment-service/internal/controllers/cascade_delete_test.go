/*
Copyright (c) 2026 Red Hat Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific
language governing permissions and limitations under the License.
*/

package controllers

import (
	"context"
	"errors"
	"fmt"
	"testing"

	privatev1 "github.com/osac-project/osac/proto/gen/osac/private/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type cascadeTestItem struct {
	id       string
	deleting bool
}

func (item cascadeTestItem) GetId() string { return item.id }

func (item cascadeTestItem) GetMetadata() *privatev1.Metadata {
	if item.deleting {
		return privatev1.Metadata_builder{DeletionTimestamp: timestamppb.Now()}.Build()
	}
	return nil
}

func TestCascadeDeleteProcessesListedChildren(t *testing.T) {
	items := []cascadeTestItem{{id: "one"}, {id: "two", deleting: true}, {id: "three"}}
	var deleted, signaled []string
	pending, err := CascadeDeleteItems(context.Background(), CascadeDeleteItemsOptions[cascadeTestItem]{
		Resource: "child",
		Items:    items,
		Delete: func(_ context.Context, id string) error {
			deleted = append(deleted, id)
			return nil
		},
		Signal: func(_ context.Context, id string) error {
			signaled = append(signaled, id)
			return nil
		},
	})
	if err != nil {
		t.Fatalf("CascadeDeleteItems() error = %v", err)
	}
	if !pending {
		t.Fatal("CascadeDeleteItems() pending = false, want true")
	}
	if fmt.Sprint(deleted) != "[one three]" {
		t.Fatalf("deleted = %v, want [one three]", deleted)
	}
	if fmt.Sprint(signaled) != "[two]" {
		t.Fatalf("signaled = %v, want [two]", signaled)
	}
}

func TestCascadeDeleteIgnoresNotFound(t *testing.T) {
	pending, err := CascadeDeleteItems(context.Background(), CascadeDeleteItemsOptions[cascadeTestItem]{
		Resource: "child",
		Items:    []cascadeTestItem{{id: "gone"}},
		Delete: func(context.Context, string) error {
			return status.Error(codes.NotFound, "already gone")
		},
	})
	if err != nil {
		t.Fatalf("CascadeDeleteItems() error = %v", err)
	}
	if pending {
		t.Fatal("CascadeDeleteItems() pending = true, want false after NotFound")
	}
}

func TestCascadeDeleteAggregatesErrorsAndKeepsPending(t *testing.T) {
	wantErr := errors.New("delete failed")
	pending, err := CascadeDeleteItems(context.Background(), CascadeDeleteItemsOptions[cascadeTestItem]{
		Resource:        "child",
		Items:           []cascadeTestItem{{id: "one"}, {id: "two"}},
		ContinueOnError: true,
		Delete: func(_ context.Context, id string) error {
			if id == "one" {
				return wantErr
			}
			return nil
		},
	})
	if !pending {
		t.Fatal("CascadeDeleteItems() pending = false, want true")
	}
	if !errors.Is(err, wantErr) {
		t.Fatalf("CascadeDeleteItems() error = %v, want wrapped delete error", err)
	}
}

func TestCascadeDeleteStopsOnFirstErrorByDefault(t *testing.T) {
	wantErr := errors.New("delete failed")
	var deleted []string
	_, err := CascadeDeleteItems(context.Background(), CascadeDeleteItemsOptions[cascadeTestItem]{
		Resource: "child",
		Items:    []cascadeTestItem{{id: "one"}, {id: "two"}},
		Delete: func(_ context.Context, id string) error {
			deleted = append(deleted, id)
			if id == "one" {
				return wantErr
			}
			return nil
		},
	})
	if !errors.Is(err, wantErr) {
		t.Fatalf("CascadeDeleteItems() error = %v, want wrapped delete error", err)
	}
	if fmt.Sprint(deleted) != "[one]" {
		t.Fatalf("deleted = %v, want only the first child", deleted)
	}
}
